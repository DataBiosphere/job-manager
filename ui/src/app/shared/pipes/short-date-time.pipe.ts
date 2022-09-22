import { DatePipe } from '@angular/common';
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'jmShortDateTime'
})
export class ShortDateTimePipe implements PipeTransform {
  constructor(private datePipe: DatePipe) {}

  isToday(date: Date): boolean {
    if (date) {
      let today: Date = new Date();

      return date.getDate() == today.getDate() &&
        date.getMonth() == today.getMonth() &&
        date.getFullYear() == today.getFullYear();
    }
  }

  isThisYear(date: Date): boolean {
    if (date) {
      let today: Date = new Date();

      return date.getFullYear() == today.getFullYear();
    }
  }

  transform(date: Date): string {
    if (date) {
      if (this.isToday(date)) {
        return 'Today, ' + this.datePipe.transform(date, 'shortTime');
      } else if (this.isThisYear(date)) {
        return this.datePipe.transform(date, 'MMM dd') +
          ', ' +
          this.datePipe.transform(date, 'shortTime');
      } else {
        return this.datePipe.transform(date, 'MMM dd, yyyy');
      }
    }
  }
}
