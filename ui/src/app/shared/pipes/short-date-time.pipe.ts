import {DatePipe} from '@angular/common';
import {Pipe, PipeTransform} from '@angular/core';

@Pipe({
  name: 'jmShortDateTime'
})
export class ShortDateTimePipe extends DatePipe implements PipeTransform {

  transform(date: Date): string {
    if (date) {
      return super.transform(date, 'MMM dd') +
        ' · ' +
        super.transform(date, 'shortTime');
    }
  }
}
