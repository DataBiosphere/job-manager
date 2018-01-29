import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';

import {ShortDateTimePipe} from "./short-date-time.pipe";
import {ErrorMessageFormatterPipe} from "./error-message-formatter.pipe";
import {DurationPipe} from "./duration.pipe";
import {
  MatAutocompleteModule,
  MatButtonModule,
  MatChipsModule,
  MatDatepickerModule,
  MatIconModule,
  MatInputModule,
  MatMenuModule,
  MatNativeDateModule,
} from "@angular/material";
import {HeaderComponent} from "./header/header.component";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    MatAutocompleteModule,
    MatButtonModule,
    MatChipsModule,
    MatDatepickerModule,
    MatIconModule,
    MatInputModule,
    MatMenuModule,
    MatNativeDateModule,
    ReactiveFormsModule,
  ],
  declarations: [
    ShortDateTimePipe,
    ErrorMessageFormatterPipe,
    DurationPipe,
    HeaderComponent
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
