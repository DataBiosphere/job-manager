import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {FailureMessage} from "../../../shared/model/FailureMessage";
import {ResourceUtils} from "../../../shared/utils/resource-utils";
import {TaskMetadata} from "../../../shared/model/TaskMetadata";

@Component({
  selector: 'jm-failures',
  templateUrl: './failures.component.html',
  styleUrls: ['./failures.component.css']
})
export class JobFailuresComponent implements OnInit {
  @Input() failures: FailureMessage[];
  displayedColumns: string[] = ['name', 'message', 'links'];
  dataSource: FailureMessage[] | null;
  totalNumErrors = 0;
  expandPanel: boolean;

  constructor() {}

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
  }
}
