import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';

import {ShortDateTimePipe} from "./pipes/short-date-time.pipe";
import {FullDateTimePipe} from "./pipes/full-date-time.pipe";
import {ErrorMessageFormatterPipe} from "./pipes/error-message-formatter.pipe";
import {DurationPipe} from "./pipes/duration.pipe";
import {
  MatAutocompleteModule,
  MatButtonModule,
  MatCheckboxModule,
  MatChipsModule,
  MatDatepickerModule,
  MatFormFieldModule,
  MatIconModule,
  MatInputModule,
  MatListModule,
  MatMenuModule,
  MatNativeDateModule,
  MatPaginatorModule,
  MatRadioModule,
  MatSlideToggleModule
} from "@angular/material";
import {ClrIconModule, ClrTooltipModule} from '@clr/angular';
import {HeaderComponent} from "./header/header.component";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {FilterChipComponent} from "./header/chips/filter-chip.component";
import {EnumSelectionComponent} from "./header/chips/enum-selection.component";
import {DatepickerInputComponent} from "./header/chips/datepicker-input.component";
import {StatusSelectionComponent} from "./header/chips/status-selection.component";
import {DatetimeComponent} from "./datetime/datetime.component";

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
    HeaderComponent,
    ShortDateTimePipe,
    FullDateTimePipe,
    DatetimeComponent,
    EnumSelectionComponent,
    StatusSelectionComponent
  ],
  providers: [],
  exports: [
    DatetimeComponent,
    ShortDateTimePipe,
    FullDateTimePipe,
    ErrorMessageFormatterPipe,
    DurationPipe,
    HeaderComponent
  ],
})
export class SharedModule {}
