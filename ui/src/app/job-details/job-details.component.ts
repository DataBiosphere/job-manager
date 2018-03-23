import {ActivatedRoute, Router} from '@angular/router';
import {Component, OnInit} from '@angular/core';

import {JobMetadataResponse} from '../shared/model/JobMetadataResponse';
import {TaskMetadata} from '../shared/model/TaskMetadata';

@Component({
  selector: 'jm-job-details',
  templateUrl: './job-details.component.html',
  styleUrls: ['./job-details.component.css'],
})
export class JobDetailsComponent implements OnInit {
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
    return this.job.inputs
      || this.job.outputs
      || (this.job.extensions
        && (this.job.extensions.sourceFile || this.job.extensions.logs));
  }
}
