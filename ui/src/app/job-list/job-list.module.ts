import { CommonModule } from '@angular/common';
import {
  MatButtonModule,
  MatCardModule,
  MatCheckboxModule,
  MatFormFieldModule,
  MatInputModule,
  MatMenuModule,
  MatOptionModule,
  MatPaginatorModule,
  MatSnackBarModule,
  MatSelectModule,
  MatSortModule,
  MatTableModule,
  MatTooltipModule,
} from '@angular/material';
import {MatDividerModule} from '@angular/material/divider';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {NgModule} from '@angular/core';
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
    MatDividerModule,
    MatFormFieldModule,
    MatInputModule,
    MatOptionModule,
    MatMenuModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatSelectModule,
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
