import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ViewContainerRef
} from '@angular/core';
import {DataSource, SelectionModel} from '@angular/cdk/collections';
import {
  MatSnackBar} from '@angular/material';
import 'rxjs/add/operator/startWith';
import 'rxjs/add/observable/merge';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/debounceTime';
import 'rxjs/add/operator/distinctUntilChanged';
import 'rxjs/add/observable/fromEvent';

import {JobManagerService} from '../../core/job-manager.service';
import {JobStatus} from '../../shared/model/JobStatus';
import {QueryJobsResult} from '../../shared/model/QueryJobsResult';
import {ErrorMessageFormatterPipe} from '../../shared/pipes/error-message-formatter.pipe';
import {JobStatusImage, primaryColumns} from '../../shared/common';
import {ActivatedRoute, Params} from '@angular/router';
import {environment} from '../../../environments/environment';

@Component({
  selector: 'jm-job-list-table',
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.css'],
})
export class JobsTableComponent implements OnInit {
  @Input() dataSource: DataSource<QueryJobsResult>;
  @Output() onJobsChanged: EventEmitter<QueryJobsResult[]> = new EventEmitter();

  private mouseoverJob: QueryJobsResult;

  public additionalColumns: string[] = [];
  public selection = new SelectionModel<QueryJobsResult>(/* allowMultiSelect */ true, []);
  public jobs: QueryJobsResult[] = [];

  // TODO(alanhwang): Allow these columns to be configured by the user
  displayedColumns = primaryColumns.slice();

  constructor(
    private readonly route: ActivatedRoute,
    private readonly jobManagerService: JobManagerService,
    private readonly viewContainer: ViewContainerRef,
    private errorBar: MatSnackBar,
  ) {}

  ngOnInit() {
    this.dataSource.connect(null).subscribe((jobs: QueryJobsResult[]) => {
      this.jobs = jobs;
      this.selection.clear();
    });
    if (environment.additionalColumns) {
      this.additionalColumns = environment.additionalColumns;
    }
    for (let column of this.additionalColumns) {
      this.displayedColumns.push(column);
    }
  }

  handleError(error: any) {
    this.handleErrorMessage(new ErrorMessageFormatterPipe().transform(error));
  }

  handleErrorMessage(msg: string) {
    this.errorBar.open(
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

  canAbortAnySelected(): boolean {
    for (let j of this.selection.selected) {
      if (this.canAbort(j)) {
        return true;
      }
    }
    return false;
  }

  getDropdownArrowUrl(): string {
    return "https://www.gstatic.com/images/icons/material/system/1x/arrow_drop_down_grey700_24dp.png"
  }

  getJobLabel(job: QueryJobsResult, label: string): string {
    if (job.labels && job.labels[label]) {
      return job.labels[label];
    }
    return "";
  }

  getQueryParams(): Params {
    return this.route.snapshot.queryParams;
  }

  getStatusUrl(status: JobStatus): string {
    return JobStatusImage[status];
  }

  onAbortJobs(): void {
    const aborts: Promise<void>[] = [];
    const selected = this.selection.selected.slice();
    for (let job of selected) {
      if (job.status == JobStatus.Running || job.status == JobStatus.Submitted) {
        aborts.push(
          this.jobManagerService.abortJob(job.id)
            .then(() => { job.status = JobStatus.Aborted; }));
      }
    }
    Promise.all(aborts)
      .then(() => this.onJobsChanged.emit(selected))
      .catch((errs) => this.handleErrorMessage(
        `failed to abort ${errs.length}/${selected.length} jobs`));
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
}
