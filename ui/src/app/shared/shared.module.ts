import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ShortDateTimePipe} from "./short-date-time.pipe";

@NgModule({
  imports: [
    CommonModule,],
  declarations: [
    ShortDateTimePipe,
  ],
  providers: [],
  exports: [
    ShortDateTimePipe,
  ],
})
export class SharedModule {}
