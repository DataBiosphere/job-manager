import {Component, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {JobMonitorService} from '../../job-monitor.service';
import {QueryJobsResult} from '../../model/QueryJobsResult';
import {StatusGroup} from './table.component';
import {JobStatus} from '../../model/JobStatus';

@Component({
  templateUrl: './list-jobs.component.html',
  styleUrls: ['./list-jobs.component.css'],
})
export class ListJobsComponent implements OnInit {

  private jobs: QueryJobsResult[] = [];

  constructor(
    private route: ActivatedRoute,
    private jobMonitorService: JobMonitorService
  ) {}

  ngOnInit(): void {
    this.updateJobs(StatusGroup.Active);
  }

  private updateJobs(statusGroup: StatusGroup): void {
    this.jobMonitorService.listJobs(this.route.snapshot.queryParams['parentId'])
      .then(response =>
        this.jobs = this.filterJobsByStatus(response.results, statusGroup));
  }

  private filterJobsByStatus(jobs: QueryJobsResult[], statusGroup: StatusGroup): QueryJobsResult[] {
    switch(statusGroup) {
      case StatusGroup.Active: {
        return jobs.filter(
          (j) => j.status != JobStatus.Failed &&
            j.status != JobStatus.Succeeded);
      }
      case StatusGroup.Completed: {
        return jobs.filter(
          (j) => j.status == JobStatus.Succeeded);
      }
      case StatusGroup.Failed: {
        return jobs.filter(
          (j) => j.status == JobStatus.Failed);
      }
      default: {
        return jobs;
      }
    }
  }
}
