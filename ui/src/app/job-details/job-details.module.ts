import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {
  MatButtonModule,
  MatCardModule,
  MatDialogModule,
  MatDividerModule,
  MatExpansionModule,
  MatGridListModule,
  MatListModule,
  MatMenuModule,
  MatSnackBarModule,
  MatProgressSpinnerModule,
  MatTableModule,
  MatTabsModule,
  MatTooltipModule,
} from '@angular/material';
import {RouterModule} from '@angular/router';
import {ClrIconModule, ClrTooltipModule} from '@clr/angular';
import {Ng2GoogleChartsModule} from 'ng2-google-charts';
import {JobDetailsComponent} from './job-details.component';
import {JobPanelsComponent} from './panels/panels.component';
import {JobResourcesComponent} from './resources/resources.component';
import {JobResourcesTableComponent} from './resources/resources-table/resources-table.component';
import {SharedModule} from '../shared/shared.module';
import {GcsService} from '../core/gcs.service';
import {JobFailuresTableComponent} from './common/failures-table/failures-table.component';
import {JobDebugIconsComponent} from "./common/debug-icons/debug-icons.component";
import {JobAttemptComponent} from "./common/attempt/attempt.component";
import {JobTabsComponent} from "./tabs/tabs.component";
import {JobTimingDiagramComponent} from "./tabs/timing-diagram/timing-diagram.component";
import {JobScatteredAttemptsComponent} from "./tabs/scattered-attempts/scattered-attempts.component";


@NgModule({
  imports: [
    ClrIconModule,
    ClrTooltipModule,
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatDialogModule,
    MatDividerModule,
    MatExpansionModule,
    MatGridListModule,
    MatListModule,
    MatMenuModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatTabsModule,
    MatTooltipModule,
    RouterModule,
    SharedModule,
    Ng2GoogleChartsModule
  ],
  entryComponents: [
    JobScatteredAttemptsComponent
  ],
  declarations: [
    JobAttemptComponent,
    JobDebugIconsComponent,
    JobDetailsComponent,
    JobPanelsComponent,
    JobResourcesComponent,
    JobResourcesTableComponent,
    JobScatteredAttemptsComponent,
    JobTabsComponent,
    JobFailuresTableComponent,
    JobTimingDiagramComponent
  ],
  providers: [
    GcsService
  ],
  exports: []
})
export class JobDetailsModule {}
