import { CommonModule } from '@angular/common';
import {
  MatButtonModule,
  MatCardModule,
  MatCheckboxModule,
  MatDialogModule,
  MatFormFieldModule,
  MatIconModule,
  MatInputModule,
  MatMenuModule,
  MatOptionModule,
  MatPaginatorModule,
  MatSnackBarModule,
  MatSelectModule,
  MatSortModule,
  MatTableModule,
  MatTooltipModule
} from '@angular/material';
import {MatDividerModule} from '@angular/material/divider';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {NgModule} from '@angular/core';
import {RouterModule} from '@angular/router';
import {ClrIconModule, ClrTooltipModule} from '@clr/angular';

import {BulkChangeComponent} from "./table/bulk-change/bulk-change.component";
import {JobDetailsResolver} from '../job-details/job-details-resolver.service';
import {JobListComponent} from './job-list.component';
import {JobsTableComponent} from './table/table.component';
import {SharedModule} from '../shared/shared.module';

@NgModule({
  imports: [
    ClrIconModule,
    ClrTooltipModule,
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatCheckboxModule,
    MatDialogModule,
    MatDividerModule,
    MatFormFieldModule,
    MatIconModule,
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
  entryComponents: [
    BulkChangeComponent,
  ],
  declarations: [
    BulkChangeComponent,
    JobListComponent,
    JobsTableComponent,
  ],
  providers: [JobDetailsResolver],
  exports: []
})
export class JobListModule {}
