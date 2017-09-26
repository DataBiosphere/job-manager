import {
  Component, Input, OnChanges, OnInit,
  SimpleChanges
} from '@angular/core';
import {JobMetadataResponse} from '../../model/JobMetadataResponse';
import {TaskMetadata} from '../../model/TaskMetadata';
import {JobQueryRequest} from '../../model/JobQueryRequest';
import StatusesEnum = JobQueryRequest.StatusesEnum;
import {isNullOrUndefined} from 'util';

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
    if (!isNullOrUndefined(this.tasks)) {
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
    if (!isNullOrUndefined(this.job.start)) {
      if (!isNullOrUndefined(this.job.end)) {
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
    if (!isNullOrUndefined(date)) {
      return date.toLocaleString();
    }
    return "";
  }
}
