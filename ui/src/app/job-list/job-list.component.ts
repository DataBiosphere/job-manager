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
import {JobsTableComponent, JobListView} from './table/table.component';

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


// An observable stream of the client's materialized jobs, where each update
// contains all jobs that have been loaded so far.
export class JobStream extends BehaviorSubject<JobListView> {
  private static readonly minBackendPageSize = 100;

  // A backend query promise which represents the pending or most recent backend
  // response. All requests synchronize through this promise to avoid duplicate
  // data loading.
  private queryPromise: Promise<QueryJobsResponse> = Promise.resolve({});

  constructor(private jobMonitorService: JobMonitorService,
              private statusGroup: StatusGroup,
              private parentId?: string) {
    super({
      results: [],
      exhaustive: false
    });
  }

  // Makes an API request if this JobStream doesn't have atLeast this many
  // total entries; no-op otherwise. The job stream may elect to load more than
  // the requested number.
  loadAtLeast(atLeast: number): void {
    this.queryPromise = this.queryPromise.then(prevResp => {
      if (this.value.exhaustive ||
        this.value.results.length >= atLeast) {
        // We've already loaded the requested number of jobs.
        return prevResp;
      }
      let pageSize = Math.max(
        JobStream.minBackendPageSize, this.value.results.length - atLeast);
      return this.queryJobs(pageSize, prevResp.nextPageToken).then(resp => {
        this.next({
          results: this.value.results.concat(resp.results),
          exhaustive: !resp.nextPageToken
        })
        return resp;
      });
    });
  }

  private queryJobs(pageSize: number, pageToken?: string): Promise<QueryJobsResponse> {
    return this.jobMonitorService.queryJobs({
      parentId: this.parentId,
      statuses: this.statusGroupToJobStatuses(this.statusGroup),
      pageSize: pageSize,
      pageToken: pageToken
    });
  }

  private statusGroupToJobStatuses(statusGroup: StatusGroup): JobStatus[] {
    switch(statusGroup) {
      case StatusGroup.Active: {
        return [JobStatus.Submitted, JobStatus.Running, JobStatus.Aborting];
      }
      case StatusGroup.Completed: {
        return [JobStatus.Succeeded, JobStatus.Aborted];
      }
      case StatusGroup.Failed: {
        return [JobStatus.Failed];
      }
      default: {
        return [];
      }
    }
  }
}
