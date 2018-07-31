import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  ViewContainerRef
} from '@angular/core';
import {
  MatSnackBar,
  MatSnackBarConfig
} from '@angular/material'

import {ErrorMessageFormatterPipe} from '../../shared/pipes/error-message-formatter.pipe';
import {JobMetadataResponse} from '../../shared/model/JobMetadataResponse';
import {JobStatus} from '../../shared/model/JobStatus';
import {TaskMetadata} from '../../shared/model/TaskMetadata';
import {ResourceUtils} from '../../shared/utils/resource-utils';
import {GcsService} from '../../core/gcs.service';

@Component({
  selector: 'jm-panels',
  templateUrl: './panels.component.html',
  styleUrls: ['./panels.component.css'],
})
export class JobPanelsComponent implements OnInit {
  // Whitelist of extended fields to display in the UI, in order.
  private static readonly extensionsWhiteList: string[] = [
    'userId', 'lastUpdate', 'parentJobId', 'statusDetail'
  ];

  @Input() job: JobMetadataResponse;
  @Output() close: EventEmitter<any> = new EventEmitter();
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
          } else if (JobStatus[task.executionStatus] == JobStatus.Failed) {
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

  handleClose(): void {
    this.close.emit();
  }
}
