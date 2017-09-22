// Based on the URL mapping in "routes" below, the RouterModule attaches
// UI Components to the <router-outlet> element in the main AppComponent.
import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';

import {ListJobsComponent} from './components/list-jobs/component';

const routes: Routes = [
  {path: '', redirectTo: '/jobs', pathMatch: 'full'},
  {path: 'jobs', component:ListJobsComponent},
];
@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
