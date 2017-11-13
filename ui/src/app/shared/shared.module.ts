import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';

import {ShortDateTimePipe} from "./short-date-time.pipe";
import {ErrorMessageFormatterPipe} from "./error-message-formatter.pipe";

@NgModule({
  imports: [
    CommonModule,
  ],
  declarations: [
    ShortDateTimePipe,
    ErrorMessageFormatterPipe,
  ],
  providers: [],
  exports: [
    ShortDateTimePipe,
    ErrorMessageFormatterPipe,
  ],
})
export class SharedModule {}
