import {BehaviorSubject} from 'rxjs/BehaviorSubject';
import {Subscription} from 'rxjs/Subscription';
import {Component, OnInit, ViewChild, ViewContainerRef} from '@angular/core';
import {PageEvent, MatSnackBar} from '@angular/material'
import {ActivatedRoute, NavigationError, Router} from '@angular/router';

import {JobManagerService} from '../core/job-manager.service';
import {ErrorMessageFormatterPipe} from '../shared/pipes/error-message-formatter.pipe';
import {JobsTableComponent} from './table/table.component';
import {JobListView, JobStream} from '../shared/job-stream';
import {URLSearchParamsUtils} from "../shared/utils/url-search-params.utils";
import {initialBackendPageSize} from "../shared/common";

@Component({
  selector: 'jm-job-list',
  templateUrl: './job-list.component.html',
  styleUrls: ['./job-list.component.css'],
})
export class JobListComponent implements OnInit {
  @ViewChild(JobsTableComponent) table: JobsTableComponent;

  private jobStream: JobStream;
  private streamSubscription: Subscription;

  // This Subject is synchronized to a JobStream, which we destroy and recreate
  // whenever we change query parameters, via a subscription.
  public jobs = new BehaviorSubject<JobListView>({
    results: [],
    exhaustive: false
  });

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
    // Handle navigation errors raised in JobDetailsResolver
    this.router.events.subscribe(event => {
      if (event instanceof NavigationError) {
        this.handleError(event.error);
      }
    });
  }

  reloadJobs(query: string) {
    if (this.streamSubscription) {
      this.streamSubscription.unsubscribe();
      this.jobStream = new JobStream(this.jobManagerService,
        URLSearchParamsUtils.unpackURLSearchParams(query));
      this.streamSubscription = this.jobStream.subscribe(resp => this.jobs.next(resp));
      this.jobStream.loadAtLeast(initialBackendPageSize)
        .catch((error) => this.handleError(error));
    }
  }

  handleError(error: any) {
    this.errorBar.open(
      new ErrorMessageFormatterPipe().transform(error),
      'Dismiss',
      {viewContainerRef: this.viewContainer});
  }

  public onClientPaginate(e: PageEvent) {
    // If the client just navigated to page n, ensure we have enough jobs to
    // display page n+1.
    this.jobStream.loadAtLeast((e.pageIndex+2) * e.pageSize)
      .catch((error) => this.handleError(error));
  }
}
