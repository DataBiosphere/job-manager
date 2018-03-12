import {
  Component,
  Input,
  OnChanges,
  SimpleChanges,
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
export class JobResourcesComponent implements OnChanges {
  @Input() job: JobMetadataResponse;

  script: string = '';
  inputs: Array<string> = [];
  logFileData: Map<string, string> = new Map();
  logFiles: Array<string> = [];
  outputs: Array<string> = [];
  currentResourcesTab: string = '';

  constructor(private readonly gcsService: GcsService) {}

  ngOnChanges(changes: SimpleChanges) {
    this.job = changes.job.currentValue;
    if (this.job.extensions) {
      if (this.job.extensions.logs) {
        this.logFiles = Object.keys(this.job.extensions.logs).sort();
        for (let file of Object.keys(this.job.extensions.logs)) {
          let bucket = ResourceUtils.getResourceBucket(this.job.extensions.logs[file]);
          let object = ResourceUtils.getResourceObject(this.job.extensions.logs[file]);
          this.gcsService.readObject(bucket, object).then(data => {
            if (data.length > 0) {
              this.logFileData.set(file, data);
            } else {
              // Remove any files from the tab which are completely empty
              this.logFiles.splice(this.logFiles.indexOf(file), 1);
            }
          })
        }
      }

      if (this.job.extensions.script) {
        this.script = this.job.extensions.script;
      }
    }

    if (this.job.inputs) {
      this.inputs = Object.keys(this.job.inputs).sort();
    }
    if (this.job.outputs) {
      this.outputs = Object.keys(this.job.outputs).sort();
    }

    if (this.hasInputs()) {
      this.currentResourcesTab = 'Inputs';
    } else if (this.hasOutputs()) {
      this.currentResourcesTab = 'Outputs';
    } else if (this.hasScript()) {
      this.currentResourcesTab = 'Script';
    } else if (this.logFiles.length > 0) {
      this.currentResourcesTab = this.logFiles[0];
    }
  }

  hasInputs(): boolean {
    return this.inputs.length > 0;
  }

  hasOutputs(): boolean {
    return this.outputs.length > 0;
  }

  hasScript(): boolean {
    return this.job.extensions && !!this.job.extensions.script;
  }

  keepExpanded(): boolean {
    return !this.job.extensions || !this.job.extensions.tasks;
  }

  tabChanged(event: MatTabChangeEvent) {
    this.currentResourcesTab = event.tab.textLabel;
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
}
