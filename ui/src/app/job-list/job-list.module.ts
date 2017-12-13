import { CommonModule } from '@angular/common';
import {
  MdButtonModule,
  MdCardModule,
  MdCheckboxModule,
  MdMenuModule,
  MdPaginatorModule,
  MdSnackBarModule,
  MdSortModule,
  MdTableModule,
  MdTooltipModule,
} from '@angular/material';
import {NgModule, ViewContainerRef} from '@angular/core';
import {RouterModule} from '@angular/router';

import {JobDetailsResolver} from '../job-details/job-details-resolver.service';
import {JobListComponent} from './job-list.component';
import {JobsTableComponent} from './table/table.component';
import {SharedModule} from '../shared/shared.module';

@NgModule({
  imports: [
    CommonModule,
    MdButtonModule,
    MdCardModule,
    MdCheckboxModule,
    MdMenuModule,
    MdPaginatorModule,
    MdSnackBarModule,
    MdSortModule,
    MdTableModule,
    MdTooltipModule,
    RouterModule,
    SharedModule,
  ],
  declarations: [
    JobListComponent,
    JobsTableComponent,
  ],
  providers: [JobDetailsResolver],
  exports: []
})
export class JobListModule {}
