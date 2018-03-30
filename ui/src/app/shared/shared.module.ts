import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';

import {ShortDateTimePipe} from "./pipes/short-date-time.pipe";
import {ErrorMessageFormatterPipe} from "./pipes/error-message-formatter.pipe";
import {DurationPipe} from "./pipes/duration.pipe";
import {
  MatAutocompleteModule,
  MatButtonModule,
  MatCheckboxModule,
  MatChipsModule,
  MatDatepickerModule,
  MatIconModule,
  MatInputModule,
  MatListModule,
  MatMenuModule,
  MatNativeDateModule,
  MatPaginatorModule,
} from "@angular/material";
import {HeaderComponent} from "./header/header.component";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {FilterChipComponent} from "./header/chips/filter-chip.component";
import {StatusSelectionComponent} from "./header/chips/status-selection.component";
import {DatepickerInputComponent} from "./header/chips/datepicker-input.component";

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    MatAutocompleteModule,
    MatButtonModule,
    MatCheckboxModule,
    MatChipsModule,
    MatDatepickerModule,
    MatIconModule,
    MatInputModule,
    MatListModule,
    MatMenuModule,
    MatNativeDateModule,
    MatPaginatorModule,
    ReactiveFormsModule,
  ],
  declarations: [
    DatepickerInputComponent,
    DurationPipe,
    ErrorMessageFormatterPipe,
    FilterChipComponent,
    HeaderComponent,
    ShortDateTimePipe,
    StatusSelectionComponent,
  ],
  providers: [],
  exports: [
    ShortDateTimePipe,
    ErrorMessageFormatterPipe,
    DurationPipe,
    HeaderComponent
  ],
})
export class SharedModule {}
