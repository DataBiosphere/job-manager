import {Component, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';

import {JobMonitorService} from '../core/job-monitor.service';
import {JobStatus} from '../shared/model/JobStatus';
import {QueryJobsResult} from '../shared/model/QueryJobsResult';
import {StatusGroup} from './table/table.component';

@Component({
  templateUrl: './job-list.component.html',
  styleUrls: ['./job-list.component.css'],
})
export class JobListComponent implements OnInit {

  private jobs: QueryJobsResult[] = [];

  constructor(
    private route: ActivatedRoute,
    private jobMonitorService: JobMonitorService
  ) {}

  ngOnInit(): void {
    this.updateJobs(StatusGroup.Active);
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
    this.jobMonitorService.queryJobs({
        parentId: this.route.snapshot.queryParams['parentId'],
        statuses: this.statusGroupToJobStatuses(statusGroup)
      })
      .then(response => this.jobs = response.results);
  }
}
