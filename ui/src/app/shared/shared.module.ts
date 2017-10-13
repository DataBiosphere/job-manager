import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {CustomTimePipe} from "./custom-time.pipe";

@NgModule({
  imports: [
    CommonModule,],
  declarations: [
    CustomTimePipe,
  ],
  providers: [],
  exports: [
    CustomTimePipe,
  ],
})
export class SharedModule {}
