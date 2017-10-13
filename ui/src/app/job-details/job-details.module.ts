import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {JobPanelsComponent} from './panels/panels.component';
import {JobDetailsComponent} from './job-details.component';
import {TaskDetailsComponent} from './tasks/tasks.component';
import {
  MdButtonModule,
  MdCardModule,
  MdMenuModule,
  MdTableModule,
  MdTabsModule,
  MdTooltipModule,
} from '@angular/material';
import {SharedModule} from '../shared/shared.module';

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
