import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {
  HttpModule, Http, BaseRequestOptions
} from '@angular/http';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {BrowserModule} from '@angular/platform-browser';
import {
  MdButtonModule,
  MdCardModule,
  MdCheckboxModule,
  MdExpansionModule,
  MdIconModule,
  MdInputModule,
  MdPaginatorModule,
  MdSortModule,
  MdTableModule,
  MdTabsModule,
  MdTooltipModule,
} from '@angular/material';
import {MockBackend} from '@angular/http/testing';

import {AppRoutingModule} from './app-routing.module';
import { AppComponent } from './app.component';
import {JobMonitorService} from './job-monitor.service';
import {
  newDefaultMockJobMonitorService,
  MockJobMonitorService
} from './mock-job-monitor.service';
import {ListJobsComponent} from './components/jobs-overview/list-jobs.component';
import {JobDetailsComponent} from './components/job-details/job-details.component';
import {JobPanelsComponent} from './components/job-details/panels.component';
import {JobsTableComponent} from './components/jobs-overview/table.component';
import {TaskDetailsComponent} from './components/job-details/tasks.component';

export function httpFactory(backend: MockBackend, options: BaseRequestOptions,
                            service: MockJobMonitorService) {
  service.subscribe(backend);
  return new Http(backend, options);
}

@NgModule({
  exports: [
    MdButtonModule,
    MdCardModule,
    MdCheckboxModule,
    MdExpansionModule,
    MdIconModule,
    MdInputModule,
    MdPaginatorModule,
    MdSortModule,
    MdTableModule,
    MdTabsModule,
    MdTooltipModule,
  ]
})
export class MaterialModule {}

@NgModule({
  imports: [
    AppRoutingModule,
    BrowserAnimationsModule,
    BrowserModule,
    FormsModule,
    HttpModule,
    MaterialModule,
  ],
  declarations: [
    AppComponent,
    JobDetailsComponent,
    ListJobsComponent,
    JobPanelsComponent,
    JobsTableComponent,
    TaskDetailsComponent,
  ],
  providers: [
    JobMonitorService,
    MockBackend,
    BaseRequestOptions,
    {
      provide: MockJobMonitorService,
      useFactory: newDefaultMockJobMonitorService,
    },
    // TODO(alahwa): Support communication with real backends.
    {
      provide: Http,
      useFactory: httpFactory,
      deps: [MockBackend, BaseRequestOptions, MockJobMonitorService],
    }
  ],
  // This specifies the top-level component, to load first.
  bootstrap: [AppComponent]
})
export class AppModule {}
