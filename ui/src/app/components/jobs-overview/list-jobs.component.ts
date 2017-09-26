import {Component, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {JobMonitorService} from '../../job-monitor.service';
import {JobQueryResult} from '../../model/JobQueryResult';
import {JobQueryRequest} from '../../model/JobQueryRequest';
import StatusesEnum = JobQueryRequest.StatusesEnum;
import {StatusGroup} from './table.component';

@Component({
  templateUrl: './list-jobs.component.html',
  styleUrls: ['./list-jobs.component.css'],
})
export class ListJobsComponent implements OnInit {

  private jobs: JobQueryResult[] = [];

  constructor(
    private route: ActivatedRoute,
    private jobMonitorService: JobMonitorService
  ) {}

  ngOnInit(): void {
    this.updateJobs(StatusGroup.Active);
  }

  private updateJobs(statusGroup: StatusGroup): void {
    this.jobMonitorService.listAllJobs()
      .then(response =>
        this.jobs = this.filterJobsByStatus(response.results, statusGroup));
  }

  private filterJobsByStatus(jobs: JobQueryResult[], statusGroup: StatusGroup): JobQueryResult[] {
    switch(statusGroup) {
      case StatusGroup.Active: {
        return jobs.filter(
          (j) => j.status != StatusesEnum[StatusesEnum.Failed] &&
            j.status != StatusesEnum[StatusesEnum.Succeeded]);
      }
      case StatusGroup.Completed: {
        return jobs.filter(
          (j) => j.status == StatusesEnum[StatusesEnum.Succeeded]);
      }
      case StatusGroup.Failed: {
        return jobs.filter(
          (j) => j.status == StatusesEnum[StatusesEnum.Failed]);
      }
      default: {
        return jobs;
      }
    }
  }
}
