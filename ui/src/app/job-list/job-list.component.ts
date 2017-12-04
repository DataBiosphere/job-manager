import {BehaviorSubject} from 'rxjs/BehaviorSubject';
import {Subscription} from 'rxjs/Subscription';
import {Component, OnInit, ViewChild, ViewContainerRef} from '@angular/core';
import {PageEvent, MdSnackBar, MdSnackBarConfig} from '@angular/material'
import {ActivatedRoute, NavigationError, Router} from '@angular/router';

import {JobManagerService} from '../core/job-manager.service';
import {StatusGroup} from '../shared/common';
import {ErrorMessageFormatterPipe} from '../shared/error-message-formatter.pipe';
import {JobsTableComponent} from './table/table.component';
import {JobListView, JobStream} from '../shared/job-stream';

@Component({
  selector: 'jm-job-list',
  templateUrl: './job-list.component.html',
  styleUrls: ['./job-list.component.css'],
})
export class JobListComponent implements OnInit {
  @ViewChild(JobsTableComponent) table: JobsTableComponent;

  private static readonly initialBackendPageSize = 200;
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
    private readonly JobManagerService: JobManagerService,
    private readonly viewContainer: ViewContainerRef,
    private errorBar: MdSnackBar,
  ) {
    this.jobStream = new JobStream(JobManagerService, StatusGroup.Active);
  }

  ngOnInit(): void {
    if (this.route.snapshot.data['stream']) {
      this.jobStream = this.route.snapshot.data['stream'];
    }
    this.streamSubscription = this.jobStream.subscribe(resp => this.jobs.next(resp));
    // Handle navigation errors raised in JobDetailsResolver
    this.router.events.subscribe(event => {
      if (event instanceof NavigationError) {
        this.handleError(event.error);
      }
    });
  }

  private currentStatusGroup(): StatusGroup {
    let statusGroup: StatusGroup =
      this.route.snapshot.queryParams['statusGroup'];
    if (statusGroup in StatusGroup) {
      return statusGroup;
    }
    return StatusGroup.Active;
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

  public maybeNavigateForStatus(statusGroup: StatusGroup): void {
    let statusParam = statusGroup === StatusGroup.Active ? null : statusGroup;
    this.router.navigate([], {
      queryParams: {
        parentId: this.route.snapshot.queryParams['parentId'],
        statusGroup: statusParam
      }
    }).then(() => {
      this.streamSubscription.unsubscribe();
      this.jobStream = new JobStream(this.JobManagerService,
                                     this.currentStatusGroup(),
                                     this.route.snapshot.queryParams['parentId']);
      this.streamSubscription = this.jobStream.subscribe(resp => this.jobs.next(resp));
      this.jobStream.loadAtLeast(JobListComponent.initialBackendPageSize)
        .catch((error) => this.handleError(error));
    });
  }
}
