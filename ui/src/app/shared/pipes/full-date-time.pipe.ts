import { DatePipe } from '@angular/common';
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'jmFullDateTime',
    standalone: false
})
export class FullDateTimePipe implements PipeTransform {
  constructor(private datePipe: DatePipe) {}

  transform(date: Date): string {
    if (date) {
      return this.datePipe.transform(date, 'MMM dd, yyyy h:mm:ss a');
    }
  }
}
