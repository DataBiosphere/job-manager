import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {
  HttpModule, Http, BaseRequestOptions
} from '@angular/http';
import {BrowserModule} from '@angular/platform-browser';
import {MockBackend} from '@angular/http/testing';

import {AppRoutingModule} from './app-routing.module';
import { AppComponent } from './app.component';
import {JobMonitorService} from './job-monitor.service';
import {newDefaultMockJobMonitorService, MockJobMonitorService} from './mock-job-monitor.service';
import {ListJobsComponent} from './components/list-jobs/component';

export function httpFactory(backend: MockBackend, options: BaseRequestOptions,
                            service: MockJobMonitorService) {
  service.subscribe(backend);
  return new Http(backend, options);
}

@NgModule({
  imports: [
    AppRoutingModule,
    BrowserModule,
    FormsModule,
    HttpModule
  ],
  declarations: [
    AppComponent,
    ListJobsComponent,
  ],
  providers: [
    JobMonitorService,
    MockBackend,
    BaseRequestOptions,
    {
      provide: MockJobMonitorService,
      useFactory: newDefaultMockJobMonitorService,
    },
    // TODO(alanhwang): Support communication with real backends.
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
