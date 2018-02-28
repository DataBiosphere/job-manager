import {BehaviorSubject} from 'rxjs/BehaviorSubject';
import {Subject} from 'rxjs/Subject';
import {Subscription} from 'rxjs/Subscription';
import {DataSource} from '@angular/cdk/collections';
import {Component, Input, OnInit, ViewChild, ViewContainerRef} from '@angular/core';
import {PageEvent, MatPaginator, MatSnackBar} from '@angular/material'
import {Observable} from 'rxjs/Observable';
import {ActivatedRoute, NavigationError, Router} from '@angular/router';

import {JobManagerService} from '../core/job-manager.service';
import {ErrorMessageFormatterPipe} from '../shared/pipes/error-message-formatter.pipe';
import {JobsTableComponent} from './table/table.component';
import {JobListView, JobStream} from '../shared/job-stream';
import {HeaderComponent} from '../shared/header/header.component';
import {URLSearchParamsUtils} from "../shared/utils/url-search-params.utils";
import {initialBackendPageSize} from "../shared/common";
import {QueryJobsResult} from '../shared/model/QueryJobsResult';

@Component({
  selector: 'jm-job-list',
  templateUrl: './job-list.component.html',
  styleUrls: ['./job-list.component.css'],
})
export class JobListComponent implements OnInit {
  @Input() pageSize: number = 50;

  @ViewChild(HeaderComponent) header: HeaderComponent;
  dataSource: DataSource<QueryJobsResult>;

  // This Subject is synchronized to a JobStream, which we destroy and recreate
  // whenever we change query parameters, via a subscription.
  jobs = new BehaviorSubject<JobListView>({
    results: [],
    exhaustive: false
  });
  loading = false;
  private jobStream: JobStream;
  private streamSubscription: Subscription;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly jobManagerService: JobManagerService,
    private readonly viewContainer: ViewContainerRef,
    private errorBar: MatSnackBar,
  ) {
    route.queryParams.subscribe(params => this.reloadJobs(params['q']));
  }

  ngOnInit(): void {
    this.jobStream = this.route.snapshot.data['stream'];
    this.streamSubscription = this.jobStream.subscribe(resp => this.jobs.next(resp));
    this.header.pageSubject.subscribe(resp => this.onClientPaginate(resp));
    this.dataSource = new JobsDataSource(this.jobs, this.header.pageSubject, {
      pageSize: this.pageSize,
      pageIndex: 0,
      length: 0,
    });
    // Handle navigation errors raised in JobDetailsResolver
    this.router.events.subscribe(event => {
      if (event instanceof NavigationError) {
        this.handleError(event.error);
      }
    });
  }

  reloadJobs(query: string) {
    if (this.streamSubscription) {
      this.loading = true;
      this.streamSubscription.unsubscribe();
      this.jobStream = new JobStream(this.jobManagerService,
          URLSearchParamsUtils.unpackURLSearchParams(query));
      this.jobStream.loadAtLeast(initialBackendPageSize)
        .then(() => {
          // Only subscribe after the initial page load finishes, to avoid
          // briefly loading an empty list of jobs.
          this.header.resetPagination();
          this.streamSubscription = this.jobStream.subscribe(this.jobs);
          this.loading = false;
        })
        .catch(error => this.handleError(error));
    }
  }

  handleError(error: any) {
    this.errorBar.open(
      new ErrorMessageFormatterPipe().transform(error),
      'Dismiss',
      {viewContainerRef: this.viewContainer});
  }

  handleJobsChanged() {
    this.reloadJobs(this.route.snapshot.queryParams['q']);
  }

  private onClientPaginate(e: PageEvent) {
    // If the client just navigated to page n, ensure we have enough jobs to
    // display page n+1.
    this.jobStream.loadAtLeast((e.pageIndex+2) * e.pageSize)
      .catch((error) => this.handleError(error));
  }
}


/** DataSource providing the list of jobs to be rendered in the table. */
export class JobsDataSource extends DataSource<QueryJobsResult> {

  constructor(
    private backendJobs: BehaviorSubject<JobListView>,
    private pageSubject: Subject<PageEvent>,
    private lastPageEvent: PageEvent) {
    super();
  }

  connect(): Observable<QueryJobsResult[]> {
    const p = this.pageSubject.map((e) => this.lastPageEvent = e);
    return Observable.merge(this.backendJobs, p).map(() => {
      const data = this.backendJobs.value.results.slice();

      // Get only the requested page
      const startIndex = this.lastPageEvent.pageIndex * this.lastPageEvent.pageSize;
      return data.splice(startIndex, this.lastPageEvent.pageSize);
    });
  }

  disconnect() {}
}
