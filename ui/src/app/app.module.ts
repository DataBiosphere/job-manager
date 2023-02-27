import { HttpClientModule } from "@angular/common/http";
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from "@angular/material/icon";
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ClrIconModule, ClrTooltipModule } from '@clr/angular';
import { Ng2GoogleChartsModule } from 'ng2-google-charts';
import { NgxJsonViewerModule } from 'ngx-json-viewer';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { CoreModule } from './core/core.module';
import { CustomIconService } from "./core/custom-icon.service";
import { DashboardModule } from "./dashboard/dashboard.module";
import { JobDetailsModule } from './job-details/job-details.module';
import { JobListModule } from './job-list/job-list.module';
import { ProjectsModule } from './projects/projects.module';
import { SignInModule } from './sign-in/sign-in.module';
import { SignInRedirectModule } from './sign-in/sign-in-redirect.module';
import { PagenotfoundComponent } from './pagenotfound/pagenotfound.component';

@NgModule({
  imports: [
    AppRoutingModule,
    BrowserAnimationsModule,
    BrowserModule,
    ClrIconModule,
    ClrTooltipModule,
    CoreModule,
    FormsModule,
    HttpClientModule,
    JobDetailsModule,
    JobListModule,
    MatIconModule,
    SignInModule,
    SignInRedirectModule,
    ProjectsModule,
    DashboardModule,
    Ng2GoogleChartsModule,
    NgxJsonViewerModule,
  ],
  providers: [CustomIconService],
  declarations: [AppComponent, PagenotfoundComponent],
  // This specifies the top-level component, to load first.
  bootstrap: [AppComponent]
})
export class AppModule {}
