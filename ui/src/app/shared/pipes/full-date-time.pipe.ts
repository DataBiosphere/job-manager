import {DatePipe} from '@angular/common';
import {Pipe, PipeTransform} from '@angular/core';

@Pipe({
  name: 'jmFullDateTime'
})
export class FullDateTimePipe extends DatePipe implements PipeTransform {

  transform(date: Date): string {
    if (date) {
      return super.transform(date, 'MMM dd, yyyy h:mm:ss a');
    }
  }
}
