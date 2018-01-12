import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';

import {ShortDateTimePipe} from "./pipes/short-date-time.pipe";
import {ErrorMessageFormatterPipe} from "./pipes/error-message-formatter.pipe";
import {DurationPipe} from "./pipes/duration.pipe";
import {
  MdAutocompleteModule,
  MdButtonModule,
  MdChipsModule,
  MdIconModule,
  MdInputModule,
  MdMenuModule
} from "@angular/material";
import {HeaderComponent} from "./header/header.component";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    MdAutocompleteModule,
    MdButtonModule,
    MdChipsModule,
    MdIconModule,
    MdInputModule,
    MdMenuModule,
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
