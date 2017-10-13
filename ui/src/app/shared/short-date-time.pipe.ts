import { Pipe, PipeTransform } from '@angular/core';
import { DatePipe } from '@angular/common';

@Pipe({
  name: 'shortDateTime'
})
export class ShortDateTimePipe extends DatePipe implements PipeTransform {

  transform(date: Date): string {
    if (this.isToday(date)) {
      return super.transform(date, 'shortTime');
    }
    return super.transform(date, 'MMM dd') +
      ' \u00B7 ' + // Middle dot
      super.transform(date, 'shortTime');
  }

  isToday(date: Date): boolean {
    let today: Date = new Date();
    return date.getUTCDate() == today.getUTCDate() &&
        date.getUTCMonth() == today.getUTCMonth() &&
        date.getUTCFullYear() == today.getUTCFullYear();
  }
}
