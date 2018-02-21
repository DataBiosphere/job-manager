import { CommonModule } from '@angular/common';
import {
  MatButtonModule,
  MatCardModule,
  MatCheckboxModule,
  MatMenuModule,
  MatPaginatorModule,
  MatSnackBarModule,
  MatSortModule,
  MatTableModule,
  MatTooltipModule,
} from '@angular/material';
import {NgModule, LOCALE_ID} from '@angular/core';
import {RouterModule} from '@angular/router';

import {JobDetailsResolver} from '../job-details/job-details-resolver.service';
import {JobListComponent} from './job-list.component';
import {JobsTableComponent} from './table/table.component';
import {SharedModule} from '../shared/shared.module';

@NgModule({
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatCheckboxModule,
    MatMenuModule,
    MatPaginatorModule,
    MatSnackBarModule,
    MatSortModule,
    MatTableModule,
    MatTooltipModule,
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
