import {
  Component,
  Input,
  OnInit,
  ViewContainerRef,
} from '@angular/core';
import {
  MatExpansionPanel,
  MatSnackBar,
  MatSnackBarConfig,
  MatTabChangeEvent
} from '@angular/material'

import {ErrorMessageFormatterPipe} from '../../shared/pipes/error-message-formatter.pipe';
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

  tabIds: Array<string> = [];
  tabTitles: Map<string, string> = new Map([
    ['inputs', 'Inputs'],
    ['outputs', 'Outputs'],
    ['source-file', 'Source File']
  ]);
  currentTabId: string;

  constructor(
    private readonly gcsService: GcsService,
    private errorBar: MatSnackBar,
    private readonly viewContainer: ViewContainerRef) {}

  ngOnInit() {
    if (this.job.inputs && Object.keys(this.job.inputs).length > 0) {
      this.inputs = Object.keys(this.job.inputs).sort();
      this.tabIds.push('inputs');
    }
    if (this.job.outputs && Object.keys(this.job.outputs).length > 0) {
      this.outputs = Object.keys(this.job.outputs).sort();
      this.tabIds.push('outputs');
    }

    if (this.job.extensions) {
      if (this.job.extensions.sourceFile && this.job.extensions.sourceFile.length > 0) {
        this.sourceFile = this.job.extensions.sourceFile;
        this.tabIds.push('source-file');
      }

      if (this.job.extensions.logs) {
        Object.keys(this.job.extensions.logs).forEach(file => this.readResourceFile(file))
      }
    }

    if (this.tabIds.length > 0) {
      this.currentTabId = this.tabIds[0];
    }
  }

  alwaysExpanded(): boolean {
    return !this.job.extensions || !this.job.extensions.tasks;
  }

  tabs(): string[] {
    return this.tabIds.map(id => this.tabTitles.get(id));
  }

  logFiles(): string[] {
    return Array.from(this.logFileData.keys());
  }

  tabChanged(event: MatTabChangeEvent) {
    this.currentTabId = this.tabIds[event.index];
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
        this.tabIds.push('log-' + file);
        this.tabTitles.set('log-' + file, file);
      }
    }).catch(error => this.handleError(error))
  }

  private handleError(error: any) {
    this.errorBar.open(
      new ErrorMessageFormatterPipe().transform(error),
      'Dismiss',
      {
        viewContainerRef: this.viewContainer,
        duration: 3000,
      });
  }
}
