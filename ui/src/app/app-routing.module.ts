import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';

import {JobDetailsComponent} from './job-details/job-details.component';
import {JobDetailsResolver} from './job-details/job-details-resolver.service';
import {JobListComponent} from './job-list/job-list.component';

// Based on the URL mapping in "routes" below, the RouterModule attaches
// UI Components to the <router-outlet> element in the main AppComponent.
const routes: Routes = [
  {path: '', redirectTo: '/jobs', pathMatch: 'full'},
  {path: 'jobs', component:JobListComponent},
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
