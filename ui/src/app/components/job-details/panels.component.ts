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

  ngOnChanges(changes: SimpleChanges) {
    this.job = changes.job.currentValue;
    if (this.job && this.job.tasks) {
      this.tasks = this.job.tasks;
      this.numTasks = this.tasks.length;
      for (let task of this.tasks) {
        if (task.executionStatus == JobStatus[JobStatus.Succeeded]) {
          this.numCompletedTasks++;
        }
      }
    }

  }

  getDuration(): String {
    let duration: number;
    if (this.job) {
      if (this.job.end) {
        duration = new Date(this.job.end).getTime() - new Date(this.job.start).getTime();
      } else {
        duration = new Date().getTime() - new Date(this.job.start).getTime();
      }
      return Math.round(duration/3600000) + "h " +
        Math.round(duration/60000)%60 + "m";
    }
    return "";
  }

  getLocaleString(date: Date): string {
    return date ? date.toLocaleString() : "";
  }
}
