import {
  Component,
  Input,
  OnChanges,
  SimpleChanges
} from '@angular/core';

import {JobMetadataResponse} from '../../shared/model/JobMetadataResponse';
import {JobStatus} from '../../shared/model/JobStatus';
import {TaskMetadata} from '../../shared/model/TaskMetadata';
import {ResourceUtils} from '../../shared/resource-utils';

@Component({
  selector: 'jm-panels',
  templateUrl: './panels.component.html',
  styleUrls: ['./panels.component.css'],
})
export class JobPanelsComponent implements OnChanges {
  @Input() job: JobMetadataResponse;
  inputs: Array<String>;
  logs: Array<String>;
  numCompletedTasks: number = 0;
  numTasks: number = 0;
  outputs: Array<String>;
  labels: Array<String>;
  tasks: TaskMetadata[];

  ngOnChanges(changes: SimpleChanges) {
    this.job = changes.job.currentValue;
    if (this.job.tasks) {
      this.tasks = this.job.tasks;
      this.numTasks = this.tasks.length;
      for (let task of this.tasks) {
        if (task.executionStatus == JobStatus[JobStatus.Succeeded]) {
          this.numCompletedTasks++;
        }
      }
    }
    this.inputs = Object.keys(this.job.inputs || {}).sort();
    this.logs = Object.keys(this.job.logs || {}).sort();
    this.outputs = Object.keys(this.job.outputs || {}).sort();
    this.labels = Object.keys(this.job.labels || {}).sort();

  }

  getInputResourceURL(key: string): string {
    return ResourceUtils.getResourceBrowserURL(this.job.inputs[key]);
  }

  getLogResourceURL(key: string): string {
    return ResourceUtils.getResourceURL(this.job.logs[key]);
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
