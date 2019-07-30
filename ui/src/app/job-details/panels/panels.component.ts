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
import {DisplayField} from "../../shared/model/DisplayField";
import {JobManagerService} from "../../core/job-manager.service";
import {MatSnackBar} from "@angular/material";
import {ErrorMessageFormatterPipe} from "../../shared/pipes/error-message-formatter.pipe";

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
  @Input() primaryLabels: DisplayField[];
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
  copyIcon = 'copy-to-clipboard';

  constructor(
    private readonly snackBar: MatSnackBar,
    private readonly jobManagerService: JobManagerService) { }

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

  hasPrimaryLabels(): boolean {
    if (this.primaryLabels && this.job.labels) {
      return this.primaryLabels.filter(label => this.job.labels.hasOwnProperty(label)).length > 0;
    }
    return false;
  }

  getStatusIcon(status: JobStatus): string {
    return JobStatusIcon[status];
  }

  abortJob() {
    this.jobManagerService.abortJob(this.job.id)
      .then(() => {
        window.location.reload();
      })
      .catch((error) => this.handleError(error));
  }

  canAbort(): boolean {
    return !this.hasParent() && (this.job.status == JobStatus.Submitted || this.job.status == JobStatus.Running);
  }

  copyJobIdToClipboard(): void {
    try {
      const jobIdInput = document.querySelector('#job-id') as HTMLInputElement;
      jobIdInput.select();
      document.execCommand('copy');
      this.changeCopyIcon('check');
    } catch (error) {
      this.changeCopyIcon('times');
      console.log(error);
    }
  }

  changeCopyIcon(newIcon: string): void {
    this.copyIcon = newIcon;
    setTimeout(() => {
      this.copyIcon ='copy-to-clipboard';
    }, 1500);
  }

  handleError(error: any) {
    this.snackBar.open(
      new ErrorMessageFormatterPipe().transform(error),
      'Dismiss');
  }
}
