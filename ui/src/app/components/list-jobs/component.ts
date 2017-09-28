import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, Params} from '@angular/router';

import {JobMonitorService} from '../../job-monitor.service';
import {QueryJobsResult} from '../../model/QueryJobsResult';
import {QueryJobsRequest} from '../../model/QueryJobsRequest';
import {JobStatus} from '../../model/JobStatus';

@Component({templateUrl: './component.html'})
export class ListJobsComponent implements OnInit {
  private jobs: QueryJobsResult[] = [];
  private selectedJobs: QueryJobsResult[] = [];
  private active: boolean = true;

  constructor(
    private route: ActivatedRoute,
    private jobMonitorService: JobMonitorService
  ) {}
  ngOnInit(): void {
    this.jobMonitorService.listAllJobs()
      .then(response => this.jobs = response.results);
  }

  toggleSelect(job: QueryJobsResult): void {
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

  areRunning(jobs: QueryJobsResult[]): boolean {
    for (let job of jobs) {
      if (job.status != JobStatus.Running) {
        return false;
      }
    }
    return true;
  }

  areActive(jobs: QueryJobsResult[]): boolean {
    for (let job of jobs) {
      if (this.isFinished(job)) {
        return false;
      }
    }
    return true;
  }

  shouldDisplayJob(job: QueryJobsResult): boolean {
    return this.isFinished(job) != this.active;
  }

  private isFinished(job: QueryJobsResult): boolean {
    return job.status == JobStatus.Aborting ||
      job.status == JobStatus.Failed ||
      job.status == JobStatus.Succeeded ||
      job.status == JobStatus.Aborted;
  }

  getStatusUrl(status: JobStatus): string {
    switch(status) {
      case JobStatus.Submitted:
        return "https://www.gstatic.com/images/icons/material/system/1x/file_upload_grey600_24dp.png";
      case JobStatus.Running:
        return "https://www.gstatic.com/images/icons/material/system/1x/autorenew_grey600_24dp.png";
      case JobStatus.Aborting:
        return "https://www.gstatic.com/images/icons/material/system/1x/report_problem_grey600_24dp.png";
      case JobStatus.Failed:
        return "https://www.gstatic.com/images/icons/material/system/1x/close_grey600_24dp.png";
      case JobStatus.Aborted:
        return "https://www.gstatic.com/images/icons/material/system/1x/report_problem_grey600_24dp.png";
      case JobStatus.Succeeded:
        return "https://www.gstatic.com/images/icons/material/system/1x/done_grey600_24dp.png";
    }
  }

  onPauseJob(job: QueryJobsResult): void {
    this.onPauseJobs([job]);
  }

  onPauseJobs(jobs: QueryJobsResult[]): void {
    // TODO (Implement)
  }

  onAbortJob(job: QueryJobsResult): void {
    this.jobMonitorService.abortJob(job.id)
      .then(response => job.status = JobStatus.Aborted);
  }

  onAbortJobs(jobs: QueryJobsResult[]): void {
    for (let job of jobs) {
      this.onAbortJob(job);
    }
    this.selectedJobs = [];
  }

  onGroupJobs(jobs: QueryJobsResult[]): void {
    // TODO (Implement)
  }

  isSelected(job: QueryJobsResult): boolean {
    return this.selectedJobs.indexOf(job) > -1;
  }
}
