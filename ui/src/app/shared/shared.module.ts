import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';

import {ShortDateTimePipe} from "./short-date-time.pipe";

@NgModule({
  imports: [
    CommonModule,
  ],
  declarations: [
    ShortDateTimePipe,
  ],
  providers: [],
  exports: [
    ShortDateTimePipe,
  ],
})
export class SharedModule {}
