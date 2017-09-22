import {Component, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {JobMonitorService} from '../../job-monitor.service';
import {JobQueryResult} from '../../model/JobQueryResult';
import {JobQueryRequest} from '../../model/JobQueryRequest';
import StatusesEnum = JobQueryRequest.StatusesEnum;

@Component({
  templateUrl: './main.html',
  styleUrls: ['./main.css'],
})
export class MainComponent implements OnInit {

  private jobs: JobQueryResult[] = [];

  constructor(
    private route: ActivatedRoute,
    private jobMonitorService: JobMonitorService
  ) {}

  ngOnInit(): void {
    this.updateJobs(true);
  }

  private updateJobs(isActive: boolean): void {
    this.jobMonitorService.listAllJobs()
      .then(response =>
        this.jobs = this.filterJobsByStatus(response.results, isActive));
  }

  private filterJobsByStatus(jobs: JobQueryResult[], isActive: boolean): JobQueryResult[] {
    if (isActive) {
      jobs = jobs.filter((j) => !this.isFinished(j))
    } else {
      jobs = jobs.filter((j) => this.isFinished(j))
    }
    return jobs;
  }

  private isFinished(job: JobQueryResult): boolean {
    return job.status == StatusesEnum[StatusesEnum.Failed] ||
      job.status == StatusesEnum[StatusesEnum.Succeeded] ||
      job.status == StatusesEnum[StatusesEnum.Aborted];
  }
}
