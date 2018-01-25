import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';

import {ShortDateTimePipe} from "./short-date-time.pipe";
import {ErrorMessageFormatterPipe} from "./error-message-formatter.pipe";
import {DurationPipe} from "./duration.pipe";
import {
  MatAutocompleteModule,
  MatButtonModule,
  MatChipsModule,
  MatIconModule,
  MatInputModule,
  MatMenuModule
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
    MatIconModule,
    MatInputModule,
    MatMenuModule,
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
