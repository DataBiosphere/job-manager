import {
  Component,
  Input,
  OnInit,
  ViewContainerRef,
} from '@angular/core';
import {
  MatExpansionPanel,
  MatSnackBar,
  MatTabChangeEvent
} from '@angular/material'

import {ErrorMessageFormatterPipe} from '../../shared/pipes/error-message-formatter.pipe';
import {JobMetadataResponse} from '../../shared/model/JobMetadataResponse';
import {ResourceUtils} from '../../shared/utils/resource-utils';
import {GcsService} from '../../core/gcs.service';
import {EventDetail} from "../../shared/model/EventDetail";

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
  eventDetails: Array<EventDetail> = [];
  logFileData: Map<string, string> = new Map();

  tabIds: Array<string> = [];
  tabTitles: Map<string, string> = new Map([
    ['source-file', 'Source File'],
    ['events', 'Events']
  ]);
  currentTabId: string;
  constructor(
    private readonly gcsService: GcsService,
    private errorBar: MatSnackBar,
    private readonly viewContainer: ViewContainerRef) {}

  ngOnInit() {
    if (this.job.extensions) {
      if (this.job.extensions.sourceFile) {
        this.sourceFile = this.job.extensions.sourceFile;
        this.tabIds.push('source-file');
      }

      if (this.job.extensions.logs && this.gcsService.canReadFiles()) {
        const files = Object.keys(this.job.extensions.logs);
        Promise.all(files.map(file => this.readResourceFile(this.job.extensions.logs[file], file)))
          .then(entries => {
            // Sort log files by the file name (tuples will be converted to
            // string and compared).
            for (let [file, data] of entries.filter(e => !!e).sort()) {
              if (data) {
                this.logFileData.set(file, data);
                this.tabIds.push('log-' + file);
                this.tabTitles.set('log-' + file, file);
              }
            }
          });
      }

      if (this.job.extensions.events) {
        this.eventDetails = this.job.extensions.events;
        this.tabIds.push('events');
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

  private readResourceFile(resource: string, file: string): Promise<[string, string]> {
    const bucket = ResourceUtils.getResourceBucket(resource);
    const object = ResourceUtils.getResourceObject(resource);
    return this.gcsService.readObject(bucket, object)
      .then(data => [file, data] as [string, string])
      .catch(error => this.handleError(error));
  }

  private handleError(error: any): any {
    this.errorBar.open(
      new ErrorMessageFormatterPipe().transform(error),
      'Dismiss',
      {
        viewContainerRef: this.viewContainer,
        duration: 3000,
      });
  }
}
