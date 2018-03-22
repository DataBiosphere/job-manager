import {
  Component,
  Input,
  OnInit,
} from '@angular/core';
import {
  MatExpansionPanel,
  MatTabChangeEvent
} from '@angular/material'

import {JobMetadataResponse} from '../../shared/model/JobMetadataResponse';
import {ResourceUtils} from '../../shared/utils/resource-utils';
import {GcsService} from '../../core/gcs.service';

@Component({
  selector: 'jm-resources',
  templateUrl: './resources.component.html',
  styleUrls: ['./resources.component.css'],
})
export class JobResourcesComponent implements OnInit {
  @Input() job: JobMetadataResponse;

  sourceFile: string = '';
  inputs: Array<string> = [];
  outputs: Array<string> = [];
  logFileData: Map<string, string> = new Map();

  // Map of tab "id" to tab title. This prevents collisions if there was, for
  // example, a log file named "inputs".
  tabTitles: Map<string, string> = new Map();
  currentTab: string = '';

  constructor(private readonly gcsService: GcsService) {}

  ngOnInit() {
    if (this.job.inputs) {
      this.inputs = Object.keys(this.job.inputs).sort();
      this.tabTitles.set('Inputs', 'inputs');
    }
    if (this.job.outputs) {
      this.outputs = Object.keys(this.job.outputs).sort();
      this.tabTitles.set('Outputs', 'outputs');
    }

    if (this.job.extensions) {
      if (this.job.extensions.sourceFile) {
        this.sourceFile = this.job.extensions.sourceFile;
        this.tabTitles.set('Source File', 'source-file');
      }

      if (this.job.extensions.logs) {
        for (let file of Object.keys(this.job.extensions.logs)) {
          this.readResourceFile(file);
          this.tabTitles.set(file, 'log-' + file);
        }
      }
    }

    if (this.tabTitles.size > 0) {
      this.currentTab = this.tabTitles.values().next().value;
    }
  }

  alwaysExpanded(): boolean {
    return !this.job.extensions || !this.job.extensions.tasks;
  }

  tabs(): string[] {
    return Array.from(this.tabTitles.keys());
  }

  logFiles(): string[] {
    return Array.from(this.logFileData.keys());
  }

  tabChanged(event: MatTabChangeEvent) {
    this.currentTab = this.tabTitles.get(event.tab.textLabel);
  }

  expandPanel(matExpansionPanel: MatExpansionPanel, event: Event): void {
    // Prevent event from bubbling
    event.stopPropagation();

    // Ignore clicks on the tab bar part of the header, if the panel is already
    // expanded. Note that this callback is triggered after the expanded
    // property has been updated, so we check if its set to true.
    if (event.target['className'].includes('tab') && !matExpansionPanel.expanded) {
      matExpansionPanel.toggle();
    }
  }

  private readResourceFile(file: string) {
    let bucket = ResourceUtils.getResourceBucket(this.job.extensions.logs[file]);
    let object = ResourceUtils.getResourceObject(this.job.extensions.logs[file]);
    this.gcsService.readObject(bucket, object).then(data => {
      if (data.length > 0) {
        this.logFileData.set(file, data);
      } else {
        // Remove any tab for files which are completely empty or do not
        // exist.
        this.tabTitles.delete(file);
        this.logFileData.delete(file);
      }
    });
  }
}
