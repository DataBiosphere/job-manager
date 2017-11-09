import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {FormsModule, ReactiveFormsModule} from '@angular/forms'
import {RouterModule} from '@angular/router';
import {
  MdAutocompleteModule,
  MdButtonModule,
  MdCardModule,
  MdInputModule,
  MdOptionModule,
  MdSnackBarModule,
} from '@angular/material'

import {JobListResolver} from '../job-list/job-list-resolver.service';
import {ProjectsComponent} from './projects.component';
import {ProjectsService} from './projects.service'
import {SharedModule} from '../shared/shared.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MdAutocompleteModule,
    MdButtonModule,
    MdCardModule,
    MdInputModule,
    MdOptionModule,
    MdSnackBarModule,
    ReactiveFormsModule,
    SharedModule,
  ],
  declarations: [
    ProjectsComponent,
  ],
  exports: [],
  providers: [ProjectsService, JobListResolver]
})
export class ProjectsModule {}
