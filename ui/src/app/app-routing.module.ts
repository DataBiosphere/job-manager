import {NgModule} from '@angular/core';
import {
  CanActivate,
  RouterModule,
  Routes
} from '@angular/router';

import {CapabilitiesActivator} from './core/capabilities-activator.service';
import {JobDetailsComponent} from './job-details/job-details.component';
import {JobDetailsResolver} from './job-details/job-details-resolver.service';
import {JobListResolver} from './job-list/job-list-resolver.service';
import { DashboardResolver } from './dashboard/dashboard.resolver.service';
import {JobListComponent} from './job-list/job-list.component';
import {PagenotfoundComponent} from './pagenotfound/pagenotfound.component';
import {SignInComponent} from './sign-in/sign-in.component';
import {ProjectsComponent} from './projects/projects.component'
import {RouteReuse} from './route-reuse.service';

import {DashboardComponent} from "./dashboard/dashboard.component";
import { SignInRedirectComponent } from './sign-in/sign-in-redirect.component';


// Based on the URL mapping in "routes" below, the RouterModule attaches
// UI Components to the <router-outlet> element in the main AppComponent.
const routes: Routes = [
  {
    path: "",
    redirectTo: "jobs",
    pathMatch: "full",
  },
  {
    path: "sign_in",
    component: SignInComponent,
    canActivate: [CapabilitiesActivator],
  },
  {
    path: "projects",
    component: ProjectsComponent,
    canActivate: [CapabilitiesActivator],
  },
  {
    path: "dashboard",
    component: DashboardComponent,
    //TODO: (zach) if the projectId param is missing, it gives a 400 error which is not desired.
    // Should be redirect to the home page.
    canActivate: [CapabilitiesActivator],
    runGuardsAndResolvers: "always",
    resolve: {
      aggregations: DashboardResolver,
    },
  },
  {
    path: "jobs",
    component: JobListComponent,
    canActivate: [CapabilitiesActivator],
    resolve: {
      stream: JobListResolver,
    },
  },
  {
    path: "jobs/:id",
    component: JobDetailsComponent,
    canActivate: [CapabilitiesActivator],
    resolve: {
      job: JobDetailsResolver,
    },
  },
  {
    path: "redirect-from-oauth",
    component: SignInRedirectComponent,
  },
  {
    path: "**",
    component: PagenotfoundComponent,
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
