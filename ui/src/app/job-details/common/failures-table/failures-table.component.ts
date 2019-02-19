import {Component, Input, OnInit} from '@angular/core';

import {AuthService} from '../../../core/auth.service';
import {FailureMessage} from "../../../shared/model/FailureMessage";
import {ResourceUtils} from "../../../shared/utils/resource-utils";
import {TaskMetadata} from "../../../shared/model/TaskMetadata";

@Component({
  selector: 'jm-failures-table',
  templateUrl: './failures-table.component.html',
  styleUrls: ['./failures-table.component.css']
})
export class JobFailuresTableComponent implements OnInit {
  @Input() failures: FailureMessage[];
  @Input() showHeaders: boolean;
  @Input() numToShow: number;
  @Input() displayedColumns: string[];
  @Input() context: string[];

  dataSource: FailureMessage[];

  constructor(private authService: AuthService) {}

  ngOnInit() {
    this.dataSource = this.failures.slice(0, this.numToShow);
  }

  getResourceUrl(url: string): string {
    if (!url) {
      return '';
    }
    return ResourceUtils.getDirectoryBrowserURL(url, this.authService.userEmail);
  }

  getTaskDirectory(task: TaskMetadata): string {
    if (task.callRoot) {
      return ResourceUtils.getDirectoryBrowserURL(task.callRoot, this.authService.userEmail);
    }
  }

  hasTaskNames(): boolean {
    let status = false;
    this.dataSource.forEach((failure) => {
      if (failure.taskName) {
        status = true;
        return;
      }
    });
    return status;
  }
}
