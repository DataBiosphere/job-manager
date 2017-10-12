import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {JobDetailsResolver} from '../job-details/job-details-resolver.service';
import {JobListComponent} from './job-list.component';
import {JobsTableComponent} from './table/table.component';
import {
  MdButtonModule,
  MdCardModule,
  MdCheckboxModule,
  MdInputModule,
  MdMenuModule,
  MdPaginatorModule,
  MdSortModule,
  MdTableModule,
  MdTabsModule,
  MdTooltipModule,
} from '@angular/material';
import {RouterModule} from '@angular/router';

@NgModule({
  imports: [
    CommonModule,
    MdButtonModule,
    MdCardModule,
    MdCheckboxModule,
    MdInputModule,
    MdMenuModule,
    MdPaginatorModule,
    MdSortModule,
    MdTableModule,
    MdTabsModule,
    MdTooltipModule,
    RouterModule,
  ],
  declarations: [
    JobListComponent,
    JobsTableComponent,
  ],
  providers: [JobDetailsResolver],
  exports: []
})
export class JobListModule {}
