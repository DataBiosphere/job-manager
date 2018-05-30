import {BehaviorSubject} from 'rxjs/BehaviorSubject';
import {Subject} from 'rxjs/Subject';
import {Subscription} from 'rxjs/Subscription';
import {DataSource} from '@angular/cdk/collections';
import {Component, Input, OnInit, ViewChild, ViewContainerRef} from '@angular/core';
import {PageEvent, MatSnackBar} from '@angular/material'
import {Observable} from 'rxjs/Observable';
import {ActivatedRoute, NavigationError, Router} from '@angular/router';

import {JobManagerService} from '../core/job-manager.service';
import {ErrorMessageFormatterPipe} from '../shared/pipes/error-message-formatter.pipe';
import {JobListView, JobStream} from '../shared/job-stream';
import {HeaderComponent} from '../shared/header/header.component';
import {URLSearchParamsUtils} from "../shared/utils/url-search-params.utils";
import {initialBackendPageSize} from "../shared/common";
import {QueryJobsResult} from '../shared/model/QueryJobsResult';
import {CapabilitiesResponse} from '../shared/model/CapabilitiesResponse';
import {CapabilitiesService} from '../core/capabilities.service';

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
  private readonly capabilities: CapabilitiesResponse;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly jobManagerService: JobManagerService,
    private readonly viewContainer: ViewContainerRef,
    private errorBar: MatSnackBar,
    readonly capabilitiesService: CapabilitiesService,
  ) {
    this.capabilities = capabilitiesService.getCapabilitiesSynchronous();
    route.queryParams.subscribe(params => this.reloadJobs(params['q']));
  }

  ngOnInit(): void {
    this.jobStream = this.route.snapshot.data['stream'];
    this.streamSubscription = this.jobStream.subscribe(this.jobs);
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
    if (!this.streamSubscription) {
      // ngOnInit hasn't happened yet, this shouldn't occur.
      return;
    }
    this.loading = true;
    const req = URLSearchParamsUtils.unpackURLSearchParams(query);
    if (!req.extensions.projectId &&
        this.capabilities.queryExtensions &&
        this.capabilities.queryExtensions.includes('projectId')) {
      // If the user manages to clear the projectId chip and the UI requires a
      // project, send them back to the project selection page.
      this.router.navigate(['projects']);
      return;
    }

    this.streamSubscription.unsubscribe();
    const nextStream = new JobStream(this.jobManagerService, req);
    nextStream.loadAtLeast(initialBackendPageSize)
      .then(() => {
        if (query !== this.route.snapshot.queryParams['q']) {
          // We initiated another query since the original request; ignore
          // the results of this old load.
          // TODO(calbach): Track/cancel any ongoing requests.
          return;
        }
        // Only subscribe after the initial page load finishes, to avoid
        // briefly loading an empty list of jobs.
        this.jobStream = nextStream;
        this.header.resetPagination();
        this.streamSubscription = this.jobStream.subscribe(this.jobs);
        this.loading = false;
      })
      .catch(error => this.handleError(error));
  }

  get tableOpacity() {
    if (this.loading) {
      return .4;
    }
    return 1.0;
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
