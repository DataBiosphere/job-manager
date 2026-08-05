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
import {MatIconModule} from "@angular/material/icon";
import {MatTableModule} from "@angular/material/table";
import {MatTooltipModule} from "@angular/material/tooltip";
import {GroupedSummaryComponent} from './grouped-summary/grouped-summary.component';
import {SharedModule} from "../shared/shared.module";


@NgModule({
  declarations: [
    DashboardComponent,
    TotalSummaryComponent,
    GroupedSummaryComponent
  ],
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatSelectModule,
    MatSortModule,
    MatTableModule,
    MatTooltipModule,
    RouterModule,
    SharedModule,
  ],
  providers: [DashboardResolver],
  exports: [],
})
export class DashboardModule {

}
