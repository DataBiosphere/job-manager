import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output
} from '@angular/core';

import {JobMetadataResponse} from '../../shared/model/JobMetadataResponse';
import {JobStatus} from '../../shared/model/JobStatus';

@Component({
  selector: 'jm-panels',
  templateUrl: './panels.component.html',
  styleUrls: ['./panels.component.css'],
})
export class JobPanelsComponent implements OnInit {
  // Whitelist of extended fields to display in the UI, in order.
  private static readonly extensionsWhiteList: string[] = [
    'userId', 'lastUpdate', 'parentJobId', 'statusDetail'
  ];

  @Input() job: JobMetadataResponse;
  @Output() close: EventEmitter<any> = new EventEmitter();
  labels: Array<string> = [];
  displayedExtensions: Array<string> = [];
  numCompletedTasks: number = 0;
  numTasks: number = 0;
  errorNumLimit: number = 3;
  errorCharLimit: number = 80;

  ngOnInit() {
    if (this.job.extensions) {
      if (this.job.extensions.tasks) {
        this.numTasks = this.job.extensions.tasks.length;
        for (let task of this.job.extensions.tasks) {
          if (task.executionStatus == JobStatus[JobStatus.Succeeded]) {
            this.numCompletedTasks++;
          }
        }
      }

      for (let displayedExtension of JobPanelsComponent.extensionsWhiteList) {
        if (this.job.extensions[displayedExtension]) {
          this.displayedExtensions.push(displayedExtension);
        }
      }
    }

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

  handleClose(): void {
    this.close.emit();
  }

  showErrorPreview(errorMessage: string): string {
    if (errorMessage.length > this.errorCharLimit) {
      return errorMessage.slice(0, this.errorCharLimit) + "...";
    }
    return errorMessage;
  }
}
