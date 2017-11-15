import {NgModule} from '@angular/core';
import {CanActivate, RouterModule, Routes} from '@angular/router';

import {AuthActivator} from './core/auth-activator.service';
import {JobDetailsComponent} from './job-details/job-details.component';
import {JobDetailsResolver} from './job-details/job-details-resolver.service';
import {JobListResolver} from './job-list/job-list-resolver.service';
import {JobListComponent} from './job-list/job-list.component';
import {SignInComponent} from './sign-in/sign-in.component';
import {ProjectsComponent} from './projects/projects.component'

import {environment} from '../environments/environment';

// Based on the URL mapping in "routes" below, the RouterModule attaches
// UI Components to the <router-outlet> element in the main AppComponent.
const routes: Routes = [
  {
    path: 'sign_in',
    component: SignInComponent
  },
  {
    path: '',
    redirectTo: environment.entryPoint,
    pathMatch: 'full'
  },
  {
    path: 'projects',
    component: ProjectsComponent,
    canActivate: [AuthActivator]
  },
  {
    path: 'jobs',
    component: JobListComponent,
    canActivate: [AuthActivator],
    resolve: {
      stream: JobListResolver
    }
  },
  {
    path: 'jobs/:id',
    component: JobDetailsComponent,
    canActivate: [AuthActivator],
    resolve: {
      job: JobDetailsResolver
    }
  },
];
@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
  providers: [JobDetailsResolver]
})
export class AppRoutingModule {}
