import { CommonModule } from '@angular/common';
import {
  MatButtonModule,
  MatCardModule,
  MatCheckboxModule,
  MatDialogModule,
  MatFormFieldModule,
  MatIconModule,
  MatInputModule,
  MatListModule,
  MatMenuModule,
  MatOptionModule,
  MatPaginatorModule,
  MatSelectModule,
  MatSlideToggleModule,
  MatSnackBarModule,
  MatSortModule,
  MatTableModule,
  MatTooltipModule
} from '@angular/material';
import {MatDividerModule} from '@angular/material/divider';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {NgModule} from '@angular/core';
import {RouterModule} from '@angular/router';
import {ClrIconModule, ClrTooltipModule} from '@clr/angular';

import {JobListComponent} from './job-list.component';
import {JobsBulkEditComponent} from "./table/bulk-edit/bulk-edit.component";
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
    MatListModule,
    MatOptionModule,
    MatMenuModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatSnackBarModule,
    MatSortModule,
    MatTableModule,
    MatTooltipModule,
    RouterModule,
    SharedModule,
  ],
  entryComponents: [
    JobsBulkEditComponent
  ],
  declarations: [
    JobListComponent,
    JobsBulkEditComponent,
    JobsTableComponent
  ],
  exports: []
})
export class JobListModule {}
