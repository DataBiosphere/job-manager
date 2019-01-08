import {ActivatedRoute, Router} from '@angular/router';
import {Component, OnInit, ViewChild} from '@angular/core';

import {JobMetadataResponse} from '../shared/model/JobMetadataResponse';
import {TaskMetadata} from '../shared/model/TaskMetadata';
import {TaskDetailsComponent} from "./tasks/tasks.component";
import {JobPanelsComponent} from "./panels/panels.component";

@Component({
  selector: 'jm-job-details',
  templateUrl: './job-details.component.html',
  styleUrls: ['./job-details.component.css'],
})
export class JobDetailsComponent implements OnInit {
  @ViewChild(TaskDetailsComponent) taskTabs;
  @ViewChild(JobPanelsComponent) jobPanels;
  public job: JobMetadataResponse;

  constructor(
    private readonly router: Router,
    private readonly route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.job = this.route.snapshot.data['job'];
  }

  hasTabs(): boolean {
    if (this.job.inputs || this.job.outputs) {
      return true;
    }
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

  handleNavUp(): void {
    if (this.job.extensions.parentJobId) {
      this.router.navigate(['/jobs/' + this.job.extensions.parentJobId], {
        queryParams: {
          'q': this.route.snapshot.queryParams['q']
        },
        replaceUrl: true,
        skipLocationChange: false
      })
      .then(result => {
        this.handleNav();
      });
    }
  }

  handleNavDown(id: string): void {
    this.router.navigate(['/jobs/' + id], {
      queryParams: {
        'q': this.route.snapshot.queryParams['q']
      },
      replaceUrl: true,
      skipLocationChange: false
    })
    .then(result => {
      this.handleNav();
    });
  }

  private handleNav() {
    this.job = this.route.snapshot.data['job'];
    this.jobPanels.job = this.job;
    this.jobPanels.setUpExtensions();
    if (this.taskTabs.failuresTable) {
      this.taskTabs.failuresTable.dataSource = this.job.failures;
    }
    if (this.jobPanels.jobFailures) {
      this.jobPanels.jobFailures.dataSource = this.job.failures.slice(0, this.jobPanels.numOfErrorsToShow);
    }
  }

  hasResources(): boolean {
    return (this.job.inputs && Object.keys(this.job.inputs).length !== 0)
      || (this.job.outputs && Object.keys(this.job.outputs).length !== 0)
      || (this.job.extensions
        && (this.job.extensions.sourceFile || this.job.extensions.logs));
  }
}
