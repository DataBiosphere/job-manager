import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';

import {JobMetadataResponse} from '../../shared/model/JobMetadataResponse';
import {JobStatus} from '../../shared/model/JobStatus';
import {JobFailuresTableComponent} from "../common/failures-table/failures-table.component";
import {JobStatusIcon} from "../../shared/common";

@Component({
  selector: 'jm-panels',
  templateUrl: './panels.component.html',
  styleUrls: ['./panels.component.css'],
})
export class JobPanelsComponent implements OnInit {

  // Whitelist of extended fields to display in the UI, in order.
  private static readonly extensionsWhiteList: string[] = [
    'userId', 'lastUpdate', 'statusDetail'
  ];

  @Input() job: JobMetadataResponse;
  @Output() close: EventEmitter<any> = new EventEmitter();
  @Output() navUp: EventEmitter<any> = new EventEmitter();
  @ViewChild(JobFailuresTableComponent) jobFailures;
  labels: Array<string> = [];
  displayedExtensions: Array<string> = [];
  numSucceededTasks: number = 0;
  numFailedTasks: number = 0;
  numRunningTasks: number = 0;
  numTasks: number = 0;
  public readonly numOfErrorsToShow = 4;

  ngOnInit() {
    this.setUpExtensions();
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

  private setUpExtensions(): void {
    this.displayedExtensions = [];
    this.numSucceededTasks = 0;
    this.numFailedTasks = 0;
    this.numRunningTasks = 0;
    this.numTasks = 0;

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

  }

  handleClose(): void {
    this.close.emit();
  }

  handleNavUp(): void {
    this.navUp.emit();
  }

  hasParent(): boolean {
    return this.job.extensions && !!this.job.extensions.parentJobId;
  }

  hasFailures(): boolean {
    return this.job.failures && (this.job.failures.length > 0);
  }

  getStatusIcon(status: JobStatus): string {
    return JobStatusIcon[status];
  }
}
