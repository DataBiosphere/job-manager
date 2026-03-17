import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ViewChild,
  ViewContainerRef,
} from '@angular/core';
import { Clipboard } from '@angular/cdk/clipboard';

import {JobMetadataResponse} from '../../shared/model/JobMetadataResponse';
import {JobStatus} from '../../shared/model/JobStatus';
import {JobFailuresTableComponent} from "../common/failures-table/failures-table.component";
import {JobStatusIcon} from "../../shared/common";
import {DisplayField} from "../../shared/model/DisplayField";
import {ResourceUtils} from "../../shared/utils/resource-utils";
import {JobManagerService} from "../../core/job-manager.service";
import {MatSnackBar} from "@angular/material/snack-bar";
import {ErrorMessageFormatterPipe} from "../../shared/pipes/error-message-formatter.pipe";
import {AuthService} from "../../core/auth.service";

@Component({
    selector: 'jm-panels',
    templateUrl: './panels.component.html',
    styleUrls: ['./panels.component.css'],
    standalone: false
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
  topLevelExecutionDirectory: string;

  constructor(
    private readonly authService: AuthService,
    private readonly snackBar: MatSnackBar,
    private readonly jobManagerService: JobManagerService,
    private readonly clipboard: Clipboard,
    private readonly viewContainer: ViewContainerRef) { }

  async ngOnInit() {
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
      return this.primaryLabels.filter(label => {
        const labelKey = label.field ? label.field.replace('labels.', '') : label;
        return this.job.labels.hasOwnProperty(labelKey);
      }).length > 0;
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
    const jobId = this.getCleanWorkflowId();
    if (this.clipboard.copy(jobId)) {
      this.snackBar.open(
        'Workflow ID copied to clipboard',
        'Dismiss',
        {
          viewContainerRef: this.viewContainer,
          duration: 2000
        });
    }
  }

  copyIdToClipboard(id: string, label: string): void {
    if (this.clipboard.copy(id)) {
      this.snackBar.open(
        `${label} copied to clipboard`,
        'Dismiss',
        {
          viewContainerRef: this.viewContainer,
          duration: 2000
        });
    }
  }

  getCleanWorkflowId(): string {
    // Strip "cromwell-" prefix if present
    return this.job.id.replace(/^cromwell-/, '');
  }

  getWorkspaceId(): string {
    return this.job.labels && this.job.labels['workspace-id'] ? this.job.labels['workspace-id'] : '';
  }

  getSubmissionId(): string {
    return this.job.labels && this.job.labels['submission-id'] ? this.job.labels['submission-id'] : '';
  }


  getTopLevelDirectory(): string {
    if (this.job.extensions && this.job.extensions.tasks) {
      this.job.extensions.tasks.forEach((task) => {
        if (this.topLevelExecutionDirectory) return;
        if (task.callRoot && task.callRoot.includes(this.job.id)) {
          const urlParts = task.callRoot.split(this.job.id);
          this.topLevelExecutionDirectory = urlParts[0] + this.job.id;
          return;
        }
      });
    }
    return ResourceUtils.getDirectoryBrowserURL(this.topLevelExecutionDirectory, this.authService.userEmail);
  }

  handleError(error: any) {
    this.snackBar.open(
      new ErrorMessageFormatterPipe().transform(error),
      'Dismiss');
  }
}
