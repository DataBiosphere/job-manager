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
  // Filter out 'envs' and 'logs' from extendedFields since these are maps and
  // require special treatment for display.
  private readonly extensionsWhiteList: string[] = ['userId', 'statusDetail', 'lastUpdate', 'parentJobId'];

  @Input() job: JobMetadataResponse;
  inputs: Array<string>;
  logs: Array<string>;
  numCompletedTasks: number = 0;
  numTasks: number = 0;
  outputs: Array<string>;
  labels: Array<string>;
  extensions: Array<string>;
  tasks: TaskMetadata[];

  ngOnChanges(changes: SimpleChanges) {
    this.job = changes.job.currentValue;
    if (this.job.extensions) {
      if (this.job.extensions.tasks) {
        this.tasks = this.job.extensions.tasks;
        this.numTasks = this.tasks.length;
        for (let task of this.tasks) {
          if (task.executionStatus == JobStatus[JobStatus.Succeeded]) {
            this.numCompletedTasks++;
          }
        }
      }

      if (this.job.extensions.logs) {
        this.logs = Object.keys(this.job.extensions.logs || {}).sort();
      }
    }
    this.inputs = Object.keys(this.job.inputs || {}).sort();
    this.outputs = Object.keys(this.job.outputs || {}).sort();
    this.labels = Object.keys(this.job.labels || {}).sort();
    this.extensions = Object.keys(this.job.extensions || {}).sort();
    this.extensions = this.extensions.filter(f => this.extensionsWhiteList.includes(f))
  }

  getInputResourceURL(key: string): string {
    return ResourceUtils.getResourceBrowserURL(this.job.inputs[key]);
  }

  getLogResourceURL(key: string): string {
    if (this.job.extensions) {
      return ResourceUtils.getResourceURL(this.job.extensions.logs[key]);
    }
  }

  getOutputResourceURL(key: string): string {
    return ResourceUtils.getResourceBrowserURL(this.job.outputs[key]);
  }

  getInputResourceFileName(key: string): string {
    return key + ': ' + ResourceUtils.getResourceFileName(this.job.inputs[key]);
  }

  getOutputResourceFileName(key: string): string {
    return key + ': ' + ResourceUtils.getResourceFileName(this.job.outputs[key]);
  }

  showInputsButton(): boolean {
    return this.inputs && this.inputs.length > 0;
  }

  showLogsButton(): boolean {
    return this.logs && this.logs.length > 0;
  }

  showOutputsButton(): boolean {
    return this.outputs && this.outputs.length > 0;
  }
}
