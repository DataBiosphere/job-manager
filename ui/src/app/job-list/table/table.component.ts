import {
  Component,
  EventEmitter,
  Injectable,
  Input,
  OnInit,
  Output,
  ViewContainerRef
} from '@angular/core';
import {DataSource, SelectionModel} from '@angular/cdk/collections';
import {MatDialog, MatSnackBar} from '@angular/material';
import 'rxjs/add/operator/startWith';
import 'rxjs/add/observable/merge';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/debounceTime';
import 'rxjs/add/operator/distinctUntilChanged';
import 'rxjs/add/observable/fromEvent';

import {CapabilitiesService} from '../../core/capabilities.service';
import {DisplayField} from '../../shared/model/DisplayField';
import {JobManagerService} from '../../core/job-manager.service';
import {JobsBulkEditComponent} from "./bulk-edit/bulk-edit.component";
import {JobStatus} from '../../shared/model/JobStatus';
import {QueryJobsResult} from '../../shared/model/QueryJobsResult';
import {ErrorMessageFormatterPipe} from '../../shared/pipes/error-message-formatter.pipe';
import {ShortDateTimePipe} from '../../shared/pipes/short-date-time.pipe'
import {JobStatusIcon} from '../../shared/common';
import {ActivatedRoute, Params} from '@angular/router';
import {BulkLabelField} from '../../shared/model/BulkLabelField';
import {UpdateJobLabelsRequest} from '../../shared/model/UpdateJobLabelsRequest';
import {UpdateJobLabelsResponse} from "../../shared/model/UpdateJobLabelsResponse";

@Component({
  selector: 'jm-job-list-table',
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.css'],
})
@Injectable()
export class JobsTableComponent implements OnInit {
  @Input() dataSource: DataSource<QueryJobsResult>;
  @Output() onJobsChanged: EventEmitter<QueryJobsResult[]> = new EventEmitter();
  @Input() displayFields: DisplayField[];

  private mouseoverJob: QueryJobsResult;

  public bulkLabelFields: BulkLabelField[];
  public selection = new SelectionModel<QueryJobsResult>(/* allowMultiSelect */ true, []);
  public jobs: QueryJobsResult[] = [];

  // currently Cromwell's limit; if there is some variability in other backends
  // this should be moved to a config
  public readonly labelCharLimit = 255;

  displayedColumns: string[];

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

  hasTimingUrl(job: QueryJobsResult): boolean {
    return job.extensions && !!job.extensions.timingUrl;
  }

  getDropdownArrowUrl(): string {
    return "https://www.gstatic.com/images/icons/material/system/1x/arrow_drop_down_grey700_24dp.png"
  }

  isStatusField(df: DisplayField): boolean {
    return df.field == "status";
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

    if (value instanceof Date) {
      // TODO(bryancrampton): Use the current locale
      return (new ShortDateTimePipe("en-US")).transform(value);
    }

    return value;
  }

  getFieldType(df: DisplayField): string {
    return df.fieldType.toString();
  }

  getFieldOptions(df: DisplayField): string[] {
    return df.validFieldValues;
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
  public setUpFieldsAndColumns() {
    this.displayedColumns = ["Checkbox", "Name", "Details"];
    this.bulkLabelFields = [];
    for (let displayField of this.displayFields) {
      if (displayField.primary) {
        this.displayedColumns.push(displayField.field);
      }
      if (displayField.bulkEditable) {
        this.bulkLabelFields.push({'displayField' : displayField, 'default' : null});
      }
    }
  }

  private prepareUpdateJobLabelsRequest (fieldValues: {}): UpdateJobLabelsRequest {
    const req: UpdateJobLabelsRequest = { labels : {} };
    for (let displayField in fieldValues) {
      req.labels[displayField.replace('labels.', '')] = fieldValues[displayField];
    }
    return req;
  }

  private doesResultHaveLabelChanges (result: object): boolean {
    return Object.keys(result['fields']).length > 0;
  }
}
