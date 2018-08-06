import {NgModule} from "@angular/core";
import {CommonModule} from "@angular/common";
import {RouterModule} from "@angular/router";

import {DashboardComponent} from "./dashboard.component";
import {TotalSummaryComponent} from './total-summary/total-summary.component';
import {DashboardResolver} from "./dashboard.resolver.service";
import {
  MatButtonModule,
  MatCardModule,
  MatSelectModule,
  MatSortModule,
  MatTableModule
} from "@angular/material";
import {GroupedSummaryComponent} from './grouped-summary/grouped-summary.component';
import {SharedModule} from "../shared/shared.module";
import {ClrIconModule, ClrTooltipModule} from "@clr/angular";


@NgModule({
  declarations: [
    DashboardComponent,
    TotalSummaryComponent,
    GroupedSummaryComponent,
  ],
  imports: [
    ClrIconModule,
    ClrTooltipModule,
    CommonModule,
    MatCardModule,
    MatTableModule,
    MatSortModule,
    MatButtonModule,
    MatSelectModule,
    RouterModule,
    SharedModule,
  ],
  providers: [DashboardResolver],
  exports: [],
})
export class DashboardModule {

}
