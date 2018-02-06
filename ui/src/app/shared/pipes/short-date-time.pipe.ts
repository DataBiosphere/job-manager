import {DatePipe} from '@angular/common';
import {Pipe, PipeTransform} from '@angular/core';

@Pipe({
  name: 'jmShortDateTime'
})
export class ShortDateTimePipe extends DatePipe implements PipeTransform {

  isToday(date: Date): boolean {
    let today: Date = new Date();
    return date.getUTCDate() == today.getUTCDate() &&
      date.getUTCMonth() == today.getUTCMonth() &&
      date.getUTCFullYear() == today.getUTCFullYear();
  }

  transform(date: Date): string {
    if (this.isToday(date)) {
      return super.transform(date, 'shortTime');
    }
    return super.transform(date, 'MMM dd') +
      ' · ' +
      super.transform(date, 'shortTime');
  }
}
