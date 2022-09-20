import { CommonModule, DatePipe } from '@angular/common';
import { NgModule } from '@angular/core';

import { MatAutocompleteModule } from "@angular/material/autocomplete";
import { MatButtonModule } from "@angular/material/button";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatChipsModule } from "@angular/material/chips";
import { MatNativeDateModule } from "@angular/material/core";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { MatExpansionModule } from "@angular/material/expansion";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { MatListModule } from "@angular/material/list";
import { MatMenuModule } from "@angular/material/menu";
import { MatPaginatorModule } from "@angular/material/paginator";
import { MatRadioModule } from "@angular/material/radio";
import { MatSlideToggleModule } from "@angular/material/slide-toggle";
import { ClrIconModule, ClrTooltipModule } from '@clr/angular';
import { DurationPipe } from "./pipes/duration.pipe";
import { ErrorMessageFormatterPipe } from "./pipes/error-message-formatter.pipe";
import { FullDateTimePipe } from "./pipes/full-date-time.pipe";
import { ShortDateTimePipe } from "./pipes/short-date-time.pipe";

import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { DatetimeComponent } from "./datetime/datetime.component";
import { DatepickerInputComponent } from "./filter-header/chips/datepicker-input.component";
import { EnumSelectionComponent } from "./filter-header/chips/enum-selection.component";
import { FilterChipComponent } from "./filter-header/chips/filter-chip.component";
import { StatusSelectionComponent } from "./filter-header/chips/status-selection.component";
import { FilterHeaderComponent } from "./filter-header/filter-header.component";

@NgModule({
  imports: [
    ClrIconModule,
    ClrTooltipModule,
    CommonModule,
    FormsModule,
    MatAutocompleteModule,
    MatButtonModule,
    MatCheckboxModule,
    MatChipsModule,
    MatDatepickerModule,
    MatExpansionModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatListModule,
    MatMenuModule,
    MatNativeDateModule,
    MatPaginatorModule,
    ReactiveFormsModule,
    MatRadioModule,
    MatSlideToggleModule
  ],
  declarations: [
    DatepickerInputComponent,
    DurationPipe,
    ErrorMessageFormatterPipe,
    FilterChipComponent,
    FilterHeaderComponent,
    ShortDateTimePipe,
    FullDateTimePipe,
    DatetimeComponent,
    EnumSelectionComponent,
    StatusSelectionComponent
  ],
  providers: [
    DatePipe
  ],
  exports: [
    DatetimeComponent,
    ShortDateTimePipe,
    FullDateTimePipe,
    ErrorMessageFormatterPipe,
    DurationPipe,
    FilterHeaderComponent
  ],
})
export class SharedModule {}
