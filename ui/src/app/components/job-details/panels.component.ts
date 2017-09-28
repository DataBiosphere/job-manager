import {
  Component, Input, OnChanges, OnInit,
  SimpleChanges
} from '@angular/core';
import {JobMetadataResponse} from '../../model/JobMetadataResponse';
import {TaskMetadata} from '../../model/TaskMetadata';
import {JobQueryRequest} from '../../model/JobQueryRequest';
import StatusesEnum = JobQueryRequest.StatusesEnum;

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
    this.tasks = this.job.tasks;
    if (this.tasks) {
      this.numTasks = this.tasks.length;
      for (let task of this.tasks) {
        if (task.executionStatus == StatusesEnum[StatusesEnum.Succeeded]) {
          this.numCompletedTasks++;
        }
      }
    }
  }

  getDuration(): String {
    let duration: number;
    if (this.job.start) {
      if (this.job.end) {
        duration = this.job.end.getTime()-this.job.start.getTime();
      } else {
        duration = new Date().getTime() - this.job.start.getTime();
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
