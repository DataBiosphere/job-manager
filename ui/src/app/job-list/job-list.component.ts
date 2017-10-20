import {BehaviorSubject} from 'rxjs/BehaviorSubject';
import {Subscription} from 'rxjs/Subscription';
import {Component, OnInit, ViewChild} from '@angular/core';
import {PageEvent} from '@angular/material'
import {ActivatedRoute, Router} from '@angular/router';

import {JobMonitorService} from '../core/job-monitor.service';
import {JobStatus} from '../shared/model/JobStatus';
import {QueryJobsResponse} from '../shared/model/QueryJobsResponse';
import {QueryJobsResult} from '../shared/model/QueryJobsResult';
import {StatusGroup} from '../shared/common';
import {JobsTableComponent} from './table/table.component';
import {JobListView, JobStream} from '../shared/job-stream';

@Component({
  templateUrl: './job-list.component.html',
  styleUrls: ['./job-list.component.css'],
})
export class JobListComponent implements OnInit {
  @ViewChild(JobsTableComponent) table: JobsTableComponent;

  private static readonly initialBackendPageSize = 200;

  // This Subject is synchronized to a JobStream, which we destroy and recreate
  // whenever we change query parameters, via a subscription.
  private jobs = new BehaviorSubject<JobListView>({
    results: [],
    exhaustive: false
  });
  private jobStream: JobStream;
  private streamSubscription: Subscription;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly jobMonitorService: JobMonitorService
  ) {
    this.jobStream = new JobStream(jobMonitorService, StatusGroup.Active);
    this.streamSubscription = this.jobStream.subscribe(resp => this.jobs.next(resp));
  }

  ngOnInit(): void {
    this.maybeNavigateForStatus(this.currentStatusGroup());
  }

  private currentStatusGroup(): StatusGroup {
    let statusGroup: StatusGroup =
      this.route.snapshot.queryParams['statusGroup'];
    if (statusGroup in StatusGroup) {
      return statusGroup;
    }
    return StatusGroup.Active;
  }

  private onClientPaginate(e: PageEvent) {
    // If the client just navigated to page n, ensure we have enough jobs to
    // display page n+1.
    this.jobStream.loadAtLeast((e.pageIndex+2) * e.pageSize);
  }

  private maybeNavigateForStatus(statusGroup: StatusGroup): void {
    let statusParam = statusGroup;
    if (statusParam === StatusGroup.Active) {
      statusParam = null;
    }
    this.router.navigate([], {
      queryParams: {
        parentId: this.route.snapshot.queryParams['parentId'],
        statusGroup: statusParam
      }
    }).then(() => {
      this.streamSubscription.unsubscribe();
      this.jobStream = new JobStream(this.jobMonitorService,
                                     this.currentStatusGroup(),
                                     this.route.snapshot.queryParams['parentId']);
      this.streamSubscription = this.jobStream.subscribe(resp => this.jobs.next(resp))
      this.jobStream.loadAtLeast(JobListComponent.initialBackendPageSize);
    });
  }
}
