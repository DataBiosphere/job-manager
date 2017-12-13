import {BehaviorSubject} from 'rxjs/BehaviorSubject';
import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ViewChild,
  ViewContainerRef
} from '@angular/core';
import {DataSource} from '@angular/cdk/collections';
import {
  MdPaginator,
  MdSnackBar,
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
import {JobStatusImage, PRIMARY_COLUMNS} from '../../shared/common';
import {JobListView} from '../../shared/job-stream';
import {ActivatedRoute, Params} from '@angular/router';
import {environment} from '../../../environments/environment';

@Component({
  selector: 'jm-job-list-table',
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.css'],
})
export class JobsTableComponent implements OnInit {
  @Input() jobs: BehaviorSubject<JobListView>;
  @Output() onPage = new EventEmitter<PageEvent>();


  private mouseoverJob: QueryJobsResult;

  public additionalColumns: string[] = [];
  public allSelected: boolean = false;
  public selectedJobs: QueryJobsResult[] = [];

  dataSource: JobsDataSource | null;
  // TODO(alanhwang): Allow these columns to be configured by the user
  displayedColumns = PRIMARY_COLUMNS;

  @ViewChild(MdPaginator) paginator: MdPaginator;
  @ViewChild('filter') filter: ElementRef;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly JobManagerService: JobManagerService,
    private readonly viewContainer: ViewContainerRef,
    private errorBar: MdSnackBar,
  ) {}

  ngOnInit() {
    this.dataSource = new JobsDataSource(this.jobs, this.paginator);
    if (environment.additionalColumns) {
      this.additionalColumns = environment.additionalColumns;
    }
    for (let column of this.additionalColumns) {
      this.displayedColumns.push(column);
    }
    this.paginator.page.subscribe((e) => this.onPage.emit(e));
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
      this.abortJob(job);
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

/** DataSource providing the list of jobs to be rendered in the table. */
export class JobsDataSource extends DataSource<any> {
  private filterChange = new BehaviorSubject('');
  get filter(): string { return this.filterChange.value; }
  set filter(filter: string) { this.filterChange.next(filter); }

  constructor(private backendJobs: BehaviorSubject<JobListView>, private paginator: MdPaginator) {
    super();
  }

  connect(): Observable<QueryJobsResult[]> {
    const displayDataChanges = [
      this.backendJobs,
      this.paginator.page,
      this.filterChange,
    ];
    return Observable.merge(...displayDataChanges).map(() => {
      const data = this.backendJobs.value.results.slice();

      // Get only the requested page
      const startIndex = this.paginator.pageIndex * this.paginator.pageSize;
      return data
        .filter((job: QueryJobsResult) => {
          let searchStr = (job.name + job.status).toLowerCase();
          return searchStr.indexOf(this.filter.toLowerCase()) != -1;
        })
        .splice(startIndex, this.paginator.pageSize);
    });
  }

  disconnect() {}
}
