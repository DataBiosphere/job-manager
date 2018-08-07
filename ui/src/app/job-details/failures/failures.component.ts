import {Component, Input, OnInit} from '@angular/core';
import {FailureMessage} from "../../shared/model/FailureMessage";
import {ResourceUtils} from "../../shared/utils/resource-utils";
import {TaskMetadata} from "../../shared/model/TaskMetadata";

@Component({
  selector: 'jm-failures',
  templateUrl: './failures.component.html',
  styleUrls: ['./failures.component.css']
})
export class JobFailuresComponent implements OnInit {
  @Input() failures: FailureMessage[];
  changeToFailuresTab: boolean;

  displayedColumns: string[] = ['name', 'message', 'links'];
  dataSource: FailureMessage[] | null;
  totalNumErrors = 0;
  expandPanel: boolean;

  ngOnInit() {
    this.expandPanel = true;
    this.totalNumErrors = this.failures.length;
    this.dataSource = this.failures.slice(0,2);
  }

  getResourceUrl(url: string): string {
    return ResourceUtils.getResourceURL(url);
  }

  getTaskDirectory(task: TaskMetadata): string {
    if (task.callRoot) {
      return ResourceUtils.getDirectoryBrowserURL(task.callRoot);
    }
  }

  showAllErrors(): void {
    this.expandPanel = false;
    this.changeToFailuresTab = true;
  }

  hasTaskNames(): boolean {
    let status = false;
    this.failures.forEach((failure) => {
      if (failure.taskName) {
        status = true;
        return;
      }
    });
    return status;
  }

  hasLinks(): boolean {
    let status = false;
    this.failures.forEach((failure) => {
      if (failure.stderr || failure.stdout || failure.callRoot) {
        status = true;
        return;
      }
    });
    return status;
  }
}