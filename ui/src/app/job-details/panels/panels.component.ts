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
  gcsPrefix: string = "https://console.cloud.google.com/storage/browser/";
  inputs: Array<String>;
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
    if (this.job.inputs) {
      this.inputs = Object.keys(this.job.inputs).sort();
    }
    if (this.job.outputs) {
      this.outputs = Object.keys(this.job.outputs).sort();
    }
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
    return this.getResourceURL(this.job.inputs[key]);
  }

  getOutputResourceURL(key: string): string {
    return this.getResourceURL(this.job.outputs[key]);
  }

  getResourceURL(url: string): string {
    let parts = url.split("/");
    if (parts[0] != "gs:" || parts[1] != "") {
      // TODO(bryancrampton): Handle invalid resource URL gracefully
      return;
    }

    // This excludes the object from the link to show the enclosing directory.
    // This is valid with wildcard glob (bucket/path/*) and directories
    // (bucket/path/dir/) as well, the * or empty string will be trimmed.
    return this.gcsPrefix + parts.slice(2,-1).join("/");
  }

  getUserId(job: JobMetadataResponse) {
    return job.labels? job.labels['user-id'] : "";
  }

  showInputsButton(): boolean {
    return this.inputs && this.inputs.length > 0;
  }

  showOutputsButton(): boolean {
    return this.outputs && this.outputs.length > 0;
  }
}
