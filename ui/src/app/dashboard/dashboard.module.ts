import {NgModule} from "@angular/core";
import {CommonModule} from "@angular/common";

import {DashboardComponent} from "./dashboard.component";
import {TotalSummaryComponent} from './total-summary/total-summary.component';
import {DashboardResolver} from "./dashboard.resolver.service";
import {MatCardModule, MatDividerModule, MatTableModule} from "@angular/material";
import { GroupedSummaryComponent } from './grouped-summary/grouped-summary.component';


@NgModule({
  declarations: [
    DashboardComponent,
    TotalSummaryComponent,
    GroupedSummaryComponent
  ],
  imports: [
    CommonModule,
    MatCardModule,
    MatDividerModule,
    MatTableModule,
  ],
  providers: [DashboardResolver],
  exports: [],
})
export class DashboardModule {

}
