import {ActivatedRoute, Router} from '@angular/router';
import {Component, OnInit, ViewChild} from '@angular/core';

import {JobMetadataResponse} from '../shared/model/JobMetadataResponse';
import {TaskMetadata} from '../shared/model/TaskMetadata';
import {TaskDetailsComponent} from "./tasks/tasks.component";
import {JobFailuresComponent} from "./failures/failures.component";

@Component({
  selector: 'jm-job-details',
  templateUrl: './job-details.component.html',
  styleUrls: ['./job-details.component.css'],
})
export class JobDetailsComponent implements OnInit {
  @ViewChild(TaskDetailsComponent) taskTabs;
  @ViewChild(JobFailuresComponent) failurePanel;
  public job: JobMetadataResponse;

  constructor(
    private readonly router: Router,
    private readonly route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.job = this.route.snapshot.data['job'];
  }

  hasTasks(): boolean {
    if (this.job.extensions) {
      let tasks: TaskMetadata[] = this.job.extensions.tasks || [];
      return tasks.length > 0;
    }
  }

  handleClose(): void {
    this.router.navigate(['jobs'], {
      queryParams: {
        'q': this.route.snapshot.queryParams['q']
      }
    });
  }

  hasResources(): boolean {
    return (this.job.extensions && (this.job.extensions.sourceFile || this.job.extensions.logs));
  }

  hasFailures(): boolean {
    return this.job.failures && this.job.failures.length !== 0;
  }

  changeSelectedTabToFailurePanel(): void {
    if(this.failurePanel && this.failurePanel.changeToFailuresTab) {
      this.taskTabs.selectedTab = 1;
    }
  }
}
