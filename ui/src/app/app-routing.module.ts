// Based on the URL mapping in "routes" below, the RouterModule attaches
// UI Components to the <router-outlet> element in the main AppComponent.
import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';

import {ListJobsComponent} from './jobs-overview/list-jobs.component';
import {JobDetailsComponent} from './job-details/job-details.component';
import {JobDetailsResolver} from './job-details/job-details-resolver.service';

const routes: Routes = [
  {path: '', redirectTo: '/jobs', pathMatch: 'full'},
  {path: 'jobs', component:ListJobsComponent},
  {path: 'jobs/:id', component: JobDetailsComponent, resolve: {
    job: JobDetailsResolver
  }},
];
@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
  providers: [JobDetailsResolver]
})
export class AppRoutingModule {}
