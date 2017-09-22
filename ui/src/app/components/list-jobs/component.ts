import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, Params} from '@angular/router';

import {JobMonitorService} from '../../job-monitor.service';
import {JobQueryResult} from '../../model/JobQueryResult';
import {JobQueryRequest} from '../../model/JobQueryRequest';
import StatusesEnum = JobQueryRequest.StatusesEnum;

@Component({templateUrl: './component.html'})
export class ListJobsComponent implements OnInit {
  private jobs: JobQueryResult[] = [];
  private selectedJobs: JobQueryResult[] = [];
  private active: boolean = true;

  constructor(
    private route: ActivatedRoute,
    private jobMonitorService: JobMonitorService
  ) {}
  ngOnInit(): void {
    this.jobMonitorService.listAllJobs()
      .then(response => this.jobs = response.results);
  }

  toggleSelect(job: JobQueryResult): void {
    if (this.isSelected(job)) {
      this.selectedJobs
        .splice(this.selectedJobs.indexOf(job), 1);
    } else {
      this.selectedJobs.push(job);
    }
  }

  toggleActive(active: boolean): void {
    if (this.active != active) {
      this.active = active;
      this.selectedJobs = [];
    }

  }

  areRunning(jobs: JobQueryResult[]): boolean {
    for (let job of jobs) {
      if (job.status != StatusesEnum[StatusesEnum.Running]) {
        return false;
      }
    }
    return true;
  }

  areActive(jobs: JobQueryResult[]): boolean {
    for (let job of jobs) {
      if (this.isFinished(job)) {
        return false;
      }
    }
    return true;
  }

  shouldDisplayJob(job: JobQueryResult): boolean {
    return this.isFinished(job) != this.active;
  }

  private isFinished(job: JobQueryResult): boolean {
    return job.status == StatusesEnum[StatusesEnum.Aborting] ||
      job.status == StatusesEnum[StatusesEnum.Failed] ||
      job.status == StatusesEnum[StatusesEnum.Succeeded] ||
      job.status == StatusesEnum[StatusesEnum.Aborted];
  }

  getStatusUrl(status: StatusesEnum): string {
    switch(status) {
      case StatusesEnum.Submitted:
        return "https://www.gstatic.com/images/icons/material/system/1x/file_upload_grey600_24dp.png";
      case StatusesEnum.Running:
        return "https://www.gstatic.com/images/icons/material/system/1x/autorenew_grey600_24dp.png";
      case StatusesEnum.Aborting:
        return "https://www.gstatic.com/images/icons/material/system/1x/report_problem_grey600_24dp.png";
      case StatusesEnum.Failed:
        return "https://www.gstatic.com/images/icons/material/system/1x/close_grey600_24dp.png";
      case StatusesEnum.Aborted:
        return "https://www.gstatic.com/images/icons/material/system/1x/report_problem_grey600_24dp.png";
      case StatusesEnum.Succeeded:
        return "https://www.gstatic.com/images/icons/material/system/1x/done_grey600_24dp.png";
    }
  }

  onPauseJob(job: JobQueryResult): void {
    this.onPauseJobs([job]);
  }

  onPauseJobs(jobs: JobQueryResult[]): void {
    // TODO (Implement)
  }

  onAbortJob(job: JobQueryResult): void {
    this.jobMonitorService.abortJob(job.id)
      .then(response => job.status = response.status);
  }

  onAbortJobs(jobs: JobQueryResult[]): void {
    for (let job of jobs) {
      this.onAbortJob(job);
    }
    this.selectedJobs = [];
  }

  onGroupJobs(jobs: JobQueryResult[]): void {
    // TODO (Implement)
  }

  isSelected(job: JobQueryResult): boolean {
    return this.selectedJobs.indexOf(job) > -1;
  }
}
