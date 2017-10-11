import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {
  HttpModule, Http, BaseRequestOptions
} from '@angular/http';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {BrowserModule} from '@angular/platform-browser';
import {AppRoutingModule} from './app-routing.module';
import { AppComponent } from './app.component';
import {ListJobsComponent} from './jobs-overview/list-jobs.component';
import {JobDetailsComponent} from './job-details/job-details.component';
import {JobPanelsComponent} from './job-details/panels/panels.component';
import {JobsTableComponent} from './jobs-overview/table/table.component';
import {TaskDetailsComponent} from './job-details/tasks/tasks.component';
import {JobDetailsResolver} from './job-details/job-details-resolver.service';
import {CoreModule} from './core/core.module';

@NgModule({
  imports: [
    AppRoutingModule,
    BrowserAnimationsModule,
    BrowserModule,
    CoreModule,
    FormsModule,
    HttpModule,
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
    JobDetailsResolver,
  ],
  // This specifies the top-level component, to load first.
  bootstrap: [AppComponent]
})
export class AppModule {}
