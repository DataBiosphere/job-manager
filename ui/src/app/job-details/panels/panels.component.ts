import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output
} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {JobMetadataResponse} from '../../shared/model/JobMetadataResponse';
import {JobStatus} from '../../shared/model/JobStatus';

@Component({
  selector: 'jm-panels',
  templateUrl: './panels.component.html',
  styleUrls: ['./panels.component.css'],
})
export class JobPanelsComponent implements OnInit {
  constructor(
    private readonly route: ActivatedRoute) { }

  // Whitelist of extended fields to display in the UI, in order.
  private static readonly extensionsWhiteList: string[] = [
    'userId', 'lastUpdate', 'parentJobId', 'statusDetail'
  ];

  @Input() job: JobMetadataResponse;
  @Output() close: EventEmitter<any> = new EventEmitter();
  @Output() navUp: EventEmitter<any> = new EventEmitter();
  labels: Array<string> = [];
  displayedExtensions: Array<string> = [];
  numSucceededTasks: number = 0;
  numFailedTasks: number = 0;
  numRunningTasks: number = 0;
  numTasks: number = 0;

  ngOnInit() {
    if (this.job.extensions) {
      if (this.job.extensions.tasks) {
        this.numTasks = this.job.extensions.tasks.length;
        for (let task of this.job.extensions.tasks) {
          if (JobStatus[task.executionStatus] == JobStatus.Succeeded) {
            this.numSucceededTasks++;
          } else if ( JobStatus[task.executionStatus] == JobStatus.Failed) {
            this.numFailedTasks++;
          } else if ([JobStatus.Submitted, JobStatus.Running].includes(JobStatus[task.executionStatus])) {
            this.numRunningTasks++;
          }
        }
      }

      for (let displayedExtension of JobPanelsComponent.extensionsWhiteList) {
        if (this.job.extensions[displayedExtension]) {
          this.displayedExtensions.push(displayedExtension);
        }
      }
    }

    if (this.job.labels) {
      this.labels = Object.keys(this.job.labels).sort();
    }
  }

  whiteListedExtensions(): string[] {
    if (!this.job.extensions) {
      return [];
    }

    let extensions: string[] = [];
    for (let extension of JobPanelsComponent.extensionsWhiteList) {
      if (this.job.extensions[extension]) {
        extensions.push(extension);
      }
    }
    return extensions;
  }

  getQueryParams(): string {
    return this.route.snapshot.queryParams['q'];
  }

  handleClose(): void {
    this.close.emit();
  }
}
