import {Component, Input, OnInit} from '@angular/core';
import {JobMetadataResponse} from "../../../../shared/model/JobMetadataResponse";
import {FailureMessage} from "../../../../shared/model/FailureMessage";
import {ResourceUtils} from "../../../../shared/utils/resource-utils";
import {TaskMetadata} from "../../../../shared/model/TaskMetadata";

@Component({
  selector: 'jm-failures-tab',
  templateUrl: './failures-tab.component.html',
  styleUrls: ['./failures-tab.component.css']
})
export class JobFailuresTabComponent implements OnInit {
  @Input() job: JobMetadataResponse;
  displayedColumns: string[] = ['name', 'message', 'links'];
  dataSource: FailureMessage[] | null;

  constructor() {}

  ngOnInit() {
    this.dataSource = this.job.failures;
  }


  getResourceUrl(url: string): string {
    return ResourceUtils.getResourceURL(url);
  }

  getTaskDirectory(task: TaskMetadata): string {
    if (task.callRoot) {
      return ResourceUtils.getDirectoryBrowserURL(task.callRoot);
    }
  }
}
