import {
  Component,
  Input,
  OnChanges,
  SimpleChanges
} from '@angular/core';

import {JobMetadataResponse} from '../../shared/model/JobMetadataResponse';
import {JobStatus} from '../../shared/model/JobStatus';
import {TaskMetadata} from '../../shared/model/TaskMetadata';

@Component({
  selector: 'jm-panels',
  templateUrl: './panels.component.html',
  styleUrls: ['./panels.component.css'],
})
export class JobPanelsComponent implements OnChanges {
  @Input() job: JobMetadataResponse;
  browserPrefix: string = "https://console.cloud.google.com/storage/browser/";
  storagePrefix: string = "https://storage.cloud.google.com/";
  inputs: Array<String>;
  logs: Array<String>;
  numCompletedTasks: number = 0;
  numTasks: number = 0;
  outputs: Array<String>;
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

  }

  getDuration(): String {
    let duration: number;
    if (this.job.end) {
      duration = this.job.end.getTime() - this.job.submission.getTime();
    } else {
      duration = new Date().getTime() - this.job.submission.getTime();
    }
    return Math.round(duration/3600000) + "h " +
      Math.round(duration/60000)%60 + "m";
  }

  getInputResourceURL(key: string): string {
    return this.getResourceBrowserURL(this.job.inputs[key]);
  }

  getLogResourceURL(key: string): string {
    return this.getResourceURL(this.job.logs[key]);
  }

  getOutputResourceURL(key: string): string {
    return this.getResourceBrowserURL(this.job.outputs[key]);
  }

  getResourceBrowserURL(uri: string): string {
    let parts = this.validateGcsURLGetParts(uri);
    // This excludes the object from the link to show the enclosing directory.
    // This is valid with wildcard glob (bucket/path/*) and directories
    // (bucket/path/dir/) as well, the * or empty string will be trimmed.
    return parts ? this.browserPrefix + parts.slice(2,-1).join("/") : undefined;
  }

  getResourceURL(uri: string): string {
    let parts = this.validateGcsURLGetParts(uri);
    return parts ? this.storagePrefix + parts.slice(2).join("/") : undefined;
  }

  formatValue(value: string): string {
    let parts = this.validateGcsURLGetParts(value);
    let formattedValue = value;
    if (parts) {
      // display the file name instead of the full resourceURL
      formattedValue = parts[parts.length -1];
    }
    return formattedValue;
  }

  private validateGcsURLGetParts(url: string): string[] {
    if (typeof(url) !== 'string') {
      return;
    }
    let parts = url.split("/");
    if (parts[0] != "gs:" || parts[1] != "") {
      // TODO(bryancrampton): Handle invalid resource URL gracefully
      return;
    }
    return parts;
  }

  getUserId() {
    return this.job.labels ? this.job.labels['user-id'] : "";
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
