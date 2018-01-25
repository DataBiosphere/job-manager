import {BehaviorSubject} from 'rxjs/BehaviorSubject';
import {Subject} from 'rxjs/Subject';
import {Subscription} from 'rxjs/Subscription';
import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
  ViewContainerRef
} from '@angular/core';
import {DataSource} from '@angular/cdk/collections';
import {
  MatPaginator,
  MatPaginatorIntl,
  MatSnackBar,
  PageEvent
} from '@angular/material';
import {Observable} from 'rxjs/Observable';
import 'rxjs/add/operator/startWith';
import 'rxjs/add/observable/merge';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/debounceTime';
import 'rxjs/add/operator/distinctUntilChanged';
import 'rxjs/add/observable/fromEvent';

import {JobManagerService} from '../../core/job-manager.service';
import {JobStatus} from '../../shared/model/JobStatus';
import {QueryJobsResult} from '../../shared/model/QueryJobsResult';
import {ErrorMessageFormatterPipe} from '../../shared/error-message-formatter.pipe';
import {JobStatusImage, primaryColumns} from '../../shared/common';
import {JobListView} from '../../shared/job-stream';
import {ActivatedRoute, Params} from '@angular/router';
import {environment} from '../../../environments/environment';

@Component({
  selector: 'jm-job-list-table',
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.css'],
})
export class JobsTableComponent implements OnInit, OnDestroy {
  @Input() jobs: BehaviorSubject<JobListView>;
  @Output() onPage = new EventEmitter<PageEvent>();

  private pageSubscription: Subscription;
  private mouseoverJob: QueryJobsResult;

  public additionalColumns: string[] = [];
  public allSelected: boolean = false;
  public selectedJobs: QueryJobsResult[] = [];

  dataSource: JobsDataSource | null;
  // TODO(alanhwang): Allow these columns to be configured by the user
  displayedColumns = primaryColumns.slice();

  @ViewChild(MatPaginator) paginator: MatPaginator;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly JobManagerService: JobManagerService,
    private readonly viewContainer: ViewContainerRef,
    private errorBar: MatSnackBar,
  ) {}

  ngOnInit() {
    // Our paginator details depend on the state of backend pagination,
    // therefore we cannot simply inject an alternate MatPaginatorIntl, as
    // recommended by the paginator documentation. _intl is public, and
    // overwriting it seems preferable to providing our own version of
    // MatPaginator.
    this.paginator._intl = new JobsPaginatorIntl(
      this.jobs, this.paginator._intl.changes);
    this.dataSource = new JobsDataSource(this.jobs, this.paginator);
    if (environment.additionalColumns) {
      this.additionalColumns = environment.additionalColumns;
    }
    for (let column of this.additionalColumns) {
      this.displayedColumns.push(column);
    }
    this.pageSubscription =
      this.paginator.page.subscribe((e) => this.onPage.emit(e));
  }

  ngOnDestroy() {
    this.pageSubscription.unsubscribe();
  }

  private onJobsChanged(): void {
    this.allSelected = false;
    this.selectedJobs = [];
    this.paginator.pageIndex = 0;
  }

  handleError(error: any) {
    this.errorBar.open(
      new ErrorMessageFormatterPipe().transform(error),
      'Dismiss',
      {
        viewContainerRef: this.viewContainer,
        duration: 3000
      });
  }

  abortJob(job: QueryJobsResult): void {
    this.JobManagerService.abortJob(job.id)
      .then(() => job.status = JobStatus.Aborted)
      .catch((error) => this.handleError(error));
  }

  canAbort(job: QueryJobsResult): boolean {
    return job.status == JobStatus.Submitted || job.status == JobStatus.Running;
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

  isSelected(job: QueryJobsResult): boolean {
    return this.selectedJobs.indexOf(job) > -1;
  }

  onAbortJobs(jobs: QueryJobsResult[]): void {
    for (let job of jobs) {
      if (job.status == JobStatus.Running || job.status == JobStatus.Submitted) {
        this.abortJob(job);
      }
    }
    this.onJobsChanged();
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

  toggleSelect(job: QueryJobsResult): void {
    if (this.isSelected(job)) {
      this.selectedJobs
        .splice(this.selectedJobs.indexOf(job), 1);
      this.allSelected = false;
    } else {
      this.selectedJobs.push(job);
    }
  }

  toggleSelectAll(): void {
    if (this.allSelected) {
      this.selectedJobs = [];
      this.allSelected = false;
    } else {
      this.selectedJobs = this.jobs.value.results.slice();
      this.allSelected = true;
    }
  }
}

/**
 * Paginator details for the jobs table. Accounts for the case where we haven't
 * loaded all jobs (matching the query) onto the client; we need to indicate
 * this rather than showing a misleading count for the number of jobs that have
 * been loaded onto the client so far.
 */
export class JobsPaginatorIntl extends MatPaginatorIntl {
  private defaultIntl = new MatPaginatorIntl()

  constructor(private backendJobs: BehaviorSubject<JobListView>,
              public changes: Subject<void>) {
    super();
    backendJobs.subscribe((jobList: JobListView) => {
      // Ensure that the paginator component is redrawn once we transition to
      // an exhaustive list of jobs.
      if (jobList.exhaustive) {
        changes.next();
      }
    });
  }

  getRangeLabel = (page: number, pageSize: number, length: number) => {
    if (this.backendJobs.value.exhaustive) {
      // Can't use proper inheritance here, since MatPaginatorIntl only defines
      // properties, rather than class methods.
      return this.defaultIntl.getRangeLabel(page, pageSize, length);
    }
    // Ported from MatPaginatorIntl - boundary checks likely unneeded.
    const startIndex = page * pageSize;
    const endIndex = startIndex < length ?
        Math.min(startIndex + pageSize, length) :
        startIndex + pageSize;
    return `${startIndex + 1} - ${endIndex} of many`;
  }
}

/** DataSource providing the list of jobs to be rendered in the table. */
export class JobsDataSource extends DataSource<any> {

  constructor(private backendJobs: BehaviorSubject<JobListView>, private paginator: MatPaginator) {
    super();
  }

  connect(): Observable<QueryJobsResult[]> {
    const displayDataChanges = [
      this.backendJobs,
      this.paginator.page,
    ];
    return Observable.merge(...displayDataChanges).map(() => {
      const data = this.backendJobs.value.results.slice();

      // Get only the requested page
      const startIndex = this.paginator.pageIndex * this.paginator.pageSize;
      return data.splice(startIndex, this.paginator.pageSize);
    });
  }

  disconnect() {}
}
