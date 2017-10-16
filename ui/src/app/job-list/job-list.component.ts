import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';

import {JobMonitorService} from '../core/job-monitor.service';
import {JobStatus} from '../shared/model/JobStatus';
import {QueryJobsResult} from '../shared/model/QueryJobsResult';
import {StatusGroup} from '../shared/common';

@Component({
  templateUrl: './job-list.component.html',
  styleUrls: ['./job-list.component.css'],
})
export class JobListComponent implements OnInit {

  // TODO(calbach): Lazily paginate the backend separately from frontend
  // pagination. Handle the client not having all matching jobs loaded into
  // memory, or even being aware of how many jobs match the current filter. For
  // now, we only display this many matching jobs.
  private static readonly MAX_BACKEND_JOBS = 256;
  private jobs: QueryJobsResult[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private jobMonitorService: JobMonitorService
  ) {}

  ngOnInit(): void {
    let statusGroup: StatusGroup =
      this.route.snapshot.queryParams['statusGroup'];
    if (statusGroup) {
      this.updateJobs(this.route.snapshot.queryParams['statusGroup']);
    } else {
      this.updateJobs(StatusGroup.Active);
    }
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

  private updateJobs(statusGroup: StatusGroup): void {
    if (this.router.navigate([], { queryParams: {
      parentId: this.route.snapshot.queryParams['parentId'],
      statusGroup: statusGroup}})) {
      this.jobMonitorService.queryJobs({
          parentId: this.route.snapshot.queryParams['parentId'],
          statuses: this.statusGroupToJobStatuses(statusGroup),
          pageSize: JobListComponent.MAX_BACKEND_JOBS
        })
        .then(response => this.jobs = response.results);
    }

  }
}
