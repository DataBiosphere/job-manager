import {DatePipe} from '@angular/common';
import {Pipe, PipeTransform} from '@angular/core';

@Pipe({
  name: 'jmShortDateTime'
})
export class ShortDateTimePipe extends DatePipe implements PipeTransform {

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
        return 'Today, ' + super.transform(date, 'shortTime');
      } else if (this.isThisYear(date)) {
        return super.transform(date, 'MMM dd') +
          ', ' +
          super.transform(date, 'shortTime');
      } else {
        return super.transform(date, 'MMM dd, yyyy');
      }
    }
  }
}
