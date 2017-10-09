import {
  Component, Input, OnChanges, SimpleChanges
} from '@angular/core';
import {JobMetadataResponse} from '../../model/JobMetadataResponse';
import {TaskMetadata} from '../../model/TaskMetadata';
import {JobStatus} from '../../model/JobStatus';

@Component({
  selector: 'panels',
  templateUrl: './panels.component.html',
  styleUrls: ['./panels.component.css'],
})
export class JobPanelsComponent implements OnChanges {
  @Input() job: JobMetadataResponse;
  tasks: TaskMetadata[];
  numCompletedTasks: number = 0;
  numTasks: number = 0;

  gcsPrefix: string = "https://console.cloud.google.com/storage/browser/";

  inputs: Array<String>;
  outputs: Array<String>;

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

    this.inputs = Object.keys(this.job.inputs).sort();
    this.outputs = Object.keys(this.job.outputs).sort();
  }

  getDuration(): String {
    let duration: number;
    if (this.job.end) {
      duration = new Date(this.job.end).getTime() - new Date(this.job.start).getTime();
    } else {
      duration = new Date().getTime() - new Date(this.job.start).getTime();
    }
    return Math.round(duration/3600000) + "h " +
      Math.round(duration/60000)%60 + "m";
  }
  
  showInputsButton(): boolean {
    return this.inputs.length > 0;
  }
  
  showOutputsButton(): boolean {
    return this.outputs.length > 0;
  }

  getInputResourceURL(key: string): string {
    return this.getResourceURL(this.job.inputs, key);
  }

  getOutputResourceURL(key: string): string {
    return this.getResourceURL(this.job.outputs, key);
  }

  getResourceURL(resources: object, key: string): string {
    let resourceParts = resources[key].split("/");
    if (resourceParts[0] != "gs:" || resourceParts[1] != "") {
      // TODO(bryancrampton): Handle invalid resource URL gracefully
      return;
    }
    
    // This excludes the object from the link to show the enclosing directory. 
    // This is valid with wildcard glob (bucket/path/*) and directories 
    // (bucket/path/dir/) as well, the * or empty string will be trimmed.
    return this.gcsPrefix + resourceParts.slice(2,-1).join("/");
  }
}
