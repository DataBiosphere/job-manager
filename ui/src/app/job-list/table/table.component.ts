import { DataSource, SelectionModel } from '@angular/cdk/collections';
import { DatePipe } from '@angular/common';
import { Component, EventEmitter, Injectable, Input, OnInit, Output, ViewContainerRef } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Params } from '@angular/router';
import { CapabilitiesService } from '../../core/capabilities.service';
import { JobManagerService } from '../../core/job-manager.service';
import { JobStatusIcon, objectNotEmpty } from '../../shared/common';
import { BulkLabelField } from '../../shared/model/BulkLabelField';
import { DisplayField } from '../../shared/model/DisplayField';
import { FieldType } from "../../shared/model/FieldType";
import { JobStatus } from '../../shared/model/JobStatus';
import { QueryJobsResult } from '../../shared/model/QueryJobsResult';
import { UpdateJobLabelsRequest } from '../../shared/model/UpdateJobLabelsRequest';
import { UpdateJobLabelsResponse } from "../../shared/model/UpdateJobLabelsResponse";
import { ErrorMessageFormatterPipe } from '../../shared/pipes/error-message-formatter.pipe';
import { ShortDateTimePipe } from '../../shared/pipes/short-date-time.pipe';
import { JobsBulkEditComponent } from "./bulk-edit/bulk-edit.component";


@Component({
  selector: 'jm-job-list-table',
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.css'],
})
@Injectable()
export class JobsTableComponent implements OnInit {
  @Input() dataSource: DataSource<QueryJobsResult>;
  @Output() onJobsChanged: EventEmitter<QueryJobsResult[]> = new EventEmitter();
  @Output() onFiltersChanged: EventEmitter<string[]> = new EventEmitter();
  @Input() displayFields: DisplayField[];

  private mouseoverJob: QueryJobsResult;

  public bulkLabelFields: BulkLabelField[];
  public selection = new SelectionModel<QueryJobsResult>(/* allowMultiSelect */ true, []);
  public jobs: QueryJobsResult[] = [];

  // currently Cromwell's limit; if there is some variability in other backends
  // this should be moved to a config
  public readonly labelCharLimit = 255;

  displayedColumns: string[];
  firstColumn: string;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly jobManagerService: JobManagerService,
    private readonly capabilitiesService: CapabilitiesService,
    private readonly viewContainer: ViewContainerRef,
    private snackBar: MatSnackBar,
    public bulkEditDialog: MatDialog) { }

  ngOnInit() {
    this.setUpFieldsAndColumns();
    this.dataSource.connect(null).subscribe((jobs: QueryJobsResult[]) => {
      this.jobs = jobs;
      this.selection.clear();
    });
  }

  handleError(error: any) {
    this.handleErrorMessage(new ErrorMessageFormatterPipe().transform(error));
  }

  handleErrorMessage(msg: string) {
    this.snackBar.open(
      msg,
      'Dismiss',
      {
        viewContainerRef: this.viewContainer,
        duration: 3000
      });
  }

  abortJob(job: QueryJobsResult) {
    this.jobManagerService.abortJob(job.id)
      .then(() => {
        job.status = JobStatus.Aborted;
        this.onJobsChanged.emit([job]);
      })
      .catch((error) => this.handleError(error));
  }

  canAbort(job: QueryJobsResult): boolean {
    return job.status == JobStatus.Submitted || job.status == JobStatus.Running;
  }

  canEdit(df: DisplayField): boolean {
    return df.editable;
  }

  canFilterBy(fieldName: string): boolean {
    return this.displayFields.filter( df => (fieldName == df.field) && df.filterable).length > 0;
  }

  setFieldValue(job: QueryJobsResult, displayField: string, value: string) {
    let fieldItems = {};
    fieldItems[displayField] = value;
    this.jobManagerService.updateJobLabels(job.id,
        this.prepareUpdateJobLabelsRequest(fieldItems))
    /* NOTE: currently, Cromwell response does not reflect whether or not the requested changes to
     * job have actually been made; it just contains what the job's labels would look like,
     * assuming the changes have gone through successfully
     */
      .then((response: UpdateJobLabelsResponse) => {
        job.labels = response.labels;
        this.onJobsChanged.emit([job]);
      })
      .catch((error) => this.handleError(error));
  }

  filterOnColumnValue(column: string, value: string) {
    const field = this.getFilterFromField(column);
    if (field && value) {
      this.onFiltersChanged.emit([field, value]);
    }
  }

  canAbortAnySelected(): boolean {
    for (let j of this.selection.selected) {
      if (this.canAbort(j)) {
        return true;
      }
    }
    return false;
  }

  canBulkUpdateLabels(): boolean {
    return this.bulkLabelFields.length && (this.selection.selected.length > 0);
  }

  showSelectionBar(): boolean {
    return this.selection.selected.length > 0;
  }

  getDropdownArrowUrl(): string {
    return "https://www.gstatic.com/images/icons/material/system/1x/arrow_drop_down_grey700_24dp.png"
  }

  isStatusField(df: DisplayField): boolean {
    return df.field == "status";
  }

  isFirstColumn(df: DisplayField): boolean {
    return df.field == this.firstColumn;
  }

  isDateField(df: DisplayField): boolean {
    return df.fieldType == FieldType.Date;
  }

  isSimpleField(df: DisplayField): boolean {
    return !this.isDateField(df) && !this.isStatusField(df) && !this.canEdit(df) && !this.isFirstColumn(df) && !this.canFilterBy(df.field);
  }

  shouldShowMenu(job: QueryJobsResult, df: DisplayField): boolean {
    return !this.isFirstColumn(df) && (this.canEdit(df) || (this.canFilterBy(df.field) && this.getFieldValue(job, df)));
  }

  getFieldValue(job: QueryJobsResult, df: DisplayField): any {
    // Handle nested fields, separated by '.', i.e. extensions.userId
    let fields = df.field.split(".");
    let value = job;
    for (let field of fields) {
      value = value[field];
      if (!value) {
        return "";
      }
    }

    if (this.isDateField(df)) {
      return value;
    }

    if (value instanceof Date) {
      // TODO(bryancrampton): Use the current locale
      return (new ShortDateTimePipe(new DatePipe("en-US"))).transform(value);
    }

    return value;
  }

  getFieldType(df: DisplayField): string {
    if (df && df.fieldType) {
      return df.fieldType.toString();
    }
    return 'text';
  }

  getFieldOptions(df: DisplayField): string[] {
    return df.validFieldValues;
  }

  getFilterFromField(field: string): string {
    const filter = this.displayFields.filter( df => (field == df.field) && df.filterable).pop();
    if (filter) {
      return filter.field.split('.').pop();
    }
  }

  getQueryParams(): Params {
    return this.route.snapshot.queryParams;
  }

  getStatusIcon(status: JobStatus): string {
    return JobStatusIcon[status];
  }

  onAbortJobs(): void {
    const aborts: Promise<void>[] = [];
    const selected = this.selection.selected.slice();

    let numErrs = 0;
    const ref = this.snackBar.open(
      'Aborting jobs...', /* action */ '',
      {
        viewContainerRef: this.viewContainer,
      });
    for (let job of selected) {
      if (job.status == JobStatus.Running || job.status == JobStatus.Submitted) {
        aborts.push(
          this.jobManagerService.abortJob(job.id)
            .then(() => { job.status = JobStatus.Aborted; })
            .catch(() => { numErrs++; }));
      }
    }
    // We catch failed aborts above so that Promise.all() waits for everything
    // to finish (the default behavior is to short-circuit fail on the first
    // failure).
    Promise.all(aborts)
      .then(() => {
        ref.dismiss();
        if (numErrs) {
          const countMsg = numErrs < aborts.length ? `${numErrs} of ${aborts.length}` : 'all';
          this.handleErrorMessage(`Failed to abort ${countMsg} requested jobs`);
        }
        this.onJobsChanged.emit(selected)
      });
  }

  showDropdownArrow(job: QueryJobsResult): boolean {
    return job == this.mouseoverJob;
  }

  toggleMouseOver(job: QueryJobsResult): void {
    if (this.mouseoverJob == job) {
      this.mouseoverJob = null;
    } else {
      this.mouseoverJob = job;
    }
  }

  /** Whether all jobs are selected. False if no jobs are displayed. */
  allSelected(): boolean {
    return this.selection.hasValue() &&
      this.selection.selected.length === this.jobs.length;
  }

  /** Whether some, but not all, jobs are selected. */
  partiallySelected(): boolean {
    return this.selection.hasValue() && !this.allSelected();
  }

  toggleSelectAll(): void {
    if (this.allSelected()) {
      this.selection.clear();
    } else {
      this.jobs.forEach(j => this.selection.select(j));
    }
  }

  updateCheckBoxSelection(clickedJob: QueryJobsResult, event: MouseEvent): void {
    // if the user has shift-clicked on a job, find the last selected job and
    // select all jobs between the two
    if (event.shiftKey && this.selection.selected) {
      const lastJobSelected = this.selection.selected[this.selection.selected.length - 1];
      const [from, to] = [
        this.jobs.findIndex(j => j.id === lastJobSelected.id),
        this.jobs.findIndex(j => j.id === clickedJob.id)
      ].sort();
      for (let i = from; i <= to; i++) {
        this.selection.select(this.jobs[i]);
      }
    }
  }

  openBulkEditDialog(): void {
    // get default values for bulk edit fields in dialog
    for (let bulkFieldItem of this.bulkLabelFields) {
      const label = bulkFieldItem.displayField.field.replace('labels.', '');
      bulkFieldItem.default = this.selection.selected[0].labels[label] || '';
      for (let job of this.selection.selected) {
        const jobLabelValue = job.labels[label] || '';
        if (bulkFieldItem.default !== jobLabelValue) {
          bulkFieldItem.default = null;
        }
      }
    }

    let dialogRef = this.bulkEditDialog.open(JobsBulkEditComponent, {
      disableClose: true,
      data: {
        'bulkLabelFields' : this.bulkLabelFields,
        'selectedJobs' :  this.selection.selected,
        'newValues': []
      }
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (!result || !this.doesResultHaveLabelChanges(result)) {
        return;
      }
      const jobUpdates: Promise<void>[] = [];
      for (let job of result.jobs) {
        jobUpdates.push(this.jobManagerService.updateJobLabels(job.id,
            this.prepareUpdateJobLabelsRequest(result.fields))
          .then((response: UpdateJobLabelsResponse) => {
            job.labels = response.labels;
          })
          .catch((error) => this.handleError(error)));
      }
      Promise.all(jobUpdates)
        .then(() => {
          this.onJobsChanged.emit(result.jobs);
        });
    });
  }

  // set up fields to display as columns and bulk update-able labels for job list table
  // add in "Details" column after the first non-checkbox column for job details menu
  public setUpFieldsAndColumns() {
    this.displayedColumns = ["Checkbox"];
    this.bulkLabelFields = [];
    for (let displayField of this.displayFields) {
      if (displayField.primary) {
        this.displayedColumns.push(displayField.field);
      }
      if (displayField.bulkEditable) {
        this.bulkLabelFields.push({'displayField' : displayField, 'default' : null});
      }
    }
    this.displayedColumns.splice(2, 0, "Details");
    this.firstColumn = this.displayedColumns[1];
  }

  private prepareUpdateJobLabelsRequest (fieldValues: {}): UpdateJobLabelsRequest {
    const req: UpdateJobLabelsRequest = { labels : {} };
    for (let displayField in fieldValues) {
      req.labels[displayField.replace('labels.', '')] = fieldValues[displayField];
    }
    return req;
  }

  private doesResultHaveLabelChanges (result: object): boolean {
    return objectNotEmpty(result['fields']);
  }
}
