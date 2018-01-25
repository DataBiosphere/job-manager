import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {
  MatButtonModule,
  MatCardModule,
  MatMenuModule,
  MatTableModule,
  MatTabsModule,
  MatTooltipModule,
} from '@angular/material';

import {JobDetailsComponent} from './job-details.component';
import {JobPanelsComponent} from './panels/panels.component';
import {SharedModule} from '../shared/shared.module';
import {TaskDetailsComponent} from './tasks/tasks.component';


@NgModule({
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatMenuModule,
    MatTableModule,
    MatTabsModule,
    MatTooltipModule,
    SharedModule,
  ],
  declarations: [
    JobDetailsComponent,
    JobPanelsComponent,
    TaskDetailsComponent,
  ],
  providers: [],
  exports: []
})
export class JobDetailsModule {}
