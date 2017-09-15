import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, Params} from '@angular/router';

import {JobMonitorService} from '../../job-monitor.service'
import {Job, Status} from '../../models/job'

@Component({templateUrl: './component.html'})
export class ListJobsComponent implements OnInit {
  private jobs: Job[] = [];
  private selectedJobs: Job[] = [];
  private active: boolean = true;

  constructor(
    private route: ActivatedRoute,
    private jobMonitorService: JobMonitorService
  ) {}
  ngOnInit(): void {
    this.jobMonitorService.listAllJobs()
      .then(response => this.jobs = response.results);
  }

  toggleSelect(job: Job): void {
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

  areRunning(jobs: Job[]): boolean {
    for (let job of jobs) {
      if (job.status != Status.running) {
        return false;
      }
    }
    return true;
  }

  areActive(jobs: Job[]): boolean {
    for (let job of jobs) {
      if (this.isFinished(job)) {
        return false;
      }
    }
    return true;
  }

  shouldDisplayJob(job: Job): boolean {
    return this.isFinished(job) != this.active;
  }

  private isFinished(job: Job): boolean {
    return job.status == Status.aborting ||
      job.status == Status.failed ||
      job.status == Status.succeeded ||
      job.status == Status.aborted;
  }

  getStatusUrl(status: Status): string {
    switch(status) {
      case Status.submitted:
        return "https://www.gstatic.com/images/icons/material/system/1x/file_upload_grey600_24dp.png";
      case Status.running:
        return "https://www.gstatic.com/images/icons/material/system/1x/autorenew_grey600_24dp.png";
      case Status.paused:
        return "https://www.gstatic.com/images/icons/material/system/1x/pause_grey600_24dp.png";
      case Status.aborting:
        return "https://www.gstatic.com/images/icons/material/system/1x/report_problem_grey600_24dp.png";
      case Status.failed:
        return "https://www.gstatic.com/images/icons/material/system/1x/close_grey600_24dp.png";
      case Status.aborted:
        return "https://www.gstatic.com/images/icons/material/system/1x/report_problem_grey600_24dp.png";
      case Status.succeeded:
        return "https://www.gstatic.com/images/icons/material/system/1x/done_grey600_24dp.png";
    }
  }

  onPauseJob(job: Job): void {
    this.onPauseJobs([job]);
  }

  onPauseJobs(jobs: Job[]): void {
    // TODO(alanhwang): Add this to the API and then implement here
    for (let job of jobs) {
      job.status = Status.paused;
    }
    this.selectedJobs = [];
  }

  onAbortJob(job: Job): void {
    this.jobMonitorService.abortJob(job.id)
      .then(response => job.status = response.status);
  }

  onAbortJobs(jobs: Job[]): void {
    for (let job of jobs) {
      this.onAbortJob(job);
    }
    this.selectedJobs = [];
  }

  onGroupJobs(jobs: Job[]): void {
    // TODO (Implement)
  }

  isSelected(job: Job): boolean {
    return this.selectedJobs.indexOf(job) > -1;
  }
}
