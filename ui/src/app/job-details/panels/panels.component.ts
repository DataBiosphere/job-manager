import {
  Component,
  Input,
  OnChanges,
  SimpleChanges
} from '@angular/core';

import {JobMetadataResponse} from '../../shared/model/JobMetadataResponse';
import {JobStatus} from '../../shared/model/JobStatus';
import {TaskMetadata} from '../../shared/model/TaskMetadata';
import {ResourceUtils} from '../../shared/utils/resource-utils';

@Component({
  selector: 'jm-panels',
  templateUrl: './panels.component.html',
  styleUrls: ['./panels.component.css'],
})
export class JobPanelsComponent implements OnChanges {
  // Whitelist of extended fields to display in the UI, in order.
  private static readonly extensionsWhiteList: string[] = ['userId', 'statusDetail', 'lastUpdate', 'parentJobId'];

  @Input() job: JobMetadataResponse;
  inputs: Array<string> = [];
  logs: Array<string> = [];
  outputs: Array<string> = []
  labels: Array<string> = []
  displayedExtensions: Array<string> = [];
  numCompletedTasks: number = 0;
  numTasks: number = 0;

  ngOnChanges(changes: SimpleChanges) {
    this.job = changes.job.currentValue;
    if (this.job.extensions) {
      if (this.job.extensions.tasks) {
        this.numTasks = this.job.extensions.tasks.length;
        for (let task of this.job.extensions.tasks) {
          if (task.executionStatus == JobStatus[JobStatus.Succeeded]) {
            this.numCompletedTasks++;
          }
        }
      }

      if (this.job.extensions.logs) {
        this.logs = Object.keys(this.job.extensions.logs).sort();
      }

      for (let displayedExtension of JobPanelsComponent.extensionsWhiteList) {
        if (this.job.extensions[displayedExtension]) {
          this.displayedExtensions.push(displayedExtension);
        }
      }
    }

    if (this.job.inputs) {
      this.inputs = Object.keys(this.job.inputs).sort();
    }
    if (this.job.outputs) {
      this.outputs = Object.keys(this.job.outputs).sort();
    }
    if (this.job.labels) {
      this.labels = Object.keys(this.job.labels).sort();
    }
  }

  getLogResourceURL(key: string): string {
    if (this.job.extensions) {
      return ResourceUtils.getResourceURL(this.job.extensions.logs[key]);
    }
  }

  hasInputs(): boolean {
    return this.inputs && this.inputs.length > 0;
  }

  hasOutputs(): boolean {
    return this.outputs && this.outputs.length > 0;
  }

  hasLogs(): boolean {
    return this.logs && this.logs.length > 0;
  }
}
