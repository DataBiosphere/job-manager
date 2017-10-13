import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {
  MdButtonModule,
  MdCardModule,
  MdMenuModule,
  MdTableModule,
  MdTabsModule,
  MdTooltipModule,
} from '@angular/material';

import {JobDetailsComponent} from './job-details.component';
import {JobPanelsComponent} from './panels/panels.component';
import {SharedModule} from '../shared/shared.module';
import {TaskDetailsComponent} from './tasks/tasks.component';


@NgModule({
  imports: [
    CommonModule,
    MdButtonModule,
    MdCardModule,
    MdMenuModule,
    MdTableModule,
    MdTabsModule,
    MdTooltipModule,
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
