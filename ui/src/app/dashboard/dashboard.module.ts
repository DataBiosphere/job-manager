import {NgModule} from "@angular/core";
import {CommonModule} from "@angular/common";
import {RouterModule} from "@angular/router";

import {DashboardComponent} from "./dashboard.component";
import {TotalSummaryComponent} from './total-summary/total-summary.component';
import {DashboardResolver} from "./dashboard.resolver.service";
import {MatButtonModule} from "@angular/material/button";
import {MatCardModule} from "@angular/material/card";
import {MatSelectModule} from "@angular/material/select";
import {MatSortModule} from "@angular/material/sort";
import {MatTableModule} from "@angular/material/table";
import {GroupedSummaryComponent} from './grouped-summary/grouped-summary.component';
import {SharedModule} from "../shared/shared.module";
import {ClrIconModule, ClrTooltipModule} from "@clr/angular";


@NgModule({
  declarations: [
    DashboardComponent,
    TotalSummaryComponent,
    GroupedSummaryComponent
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
