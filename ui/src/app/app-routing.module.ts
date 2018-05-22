import {NgModule} from '@angular/core';
import {
  CanActivate,
  RouterModule,
  RouteReuseStrategy,
  Routes
} from '@angular/router';

import {CapabilitiesActivator} from './core/capabilities-activator.service';
import {JobDetailsComponent} from './job-details/job-details.component';
import {JobDetailsResolver} from './job-details/job-details-resolver.service';
import {JobListResolver} from './job-list/job-list-resolver.service';
import {JobListComponent} from './job-list/job-list.component';
import {SignInComponent} from './sign-in/sign-in.component';
import {ProjectsComponent} from './projects/projects.component'
import {RouteReuse} from './route-reuse.service';

import {environment} from '../environments/environment';

// Based on the URL mapping in "routes" below, the RouterModule attaches
// UI Components to the <router-outlet> element in the main AppComponent.
const routes: Routes = [
  {
    path: '',
    redirectTo: 'jobs',
    pathMatch: 'full'
  },
  {
    path: 'sign_in',
    component: SignInComponent,
    canActivate: [CapabilitiesActivator]
  },
  {
    path: 'projects',
    component: ProjectsComponent,
    canActivate: [CapabilitiesActivator]
  },
  {
    path: 'jobs',
    component: JobListComponent,
    canActivate: [CapabilitiesActivator],
    resolve: {
      stream: JobListResolver
    }
  },
  {
    path: 'jobs/:id',
    component: JobDetailsComponent,
    canActivate: [CapabilitiesActivator],
    resolve: {
      job: JobDetailsResolver
    }
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
  providers: [
    JobDetailsResolver,
    {
      provide: RouteReuseStrategy,
      useClass: RouteReuse
    }
  ]
})
export class AppRoutingModule {}
