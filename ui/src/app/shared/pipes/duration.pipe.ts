import {Pipe, PipeTransform} from '@angular/core';

@Pipe({
  name: 'jmDuration'
})
export class DurationPipe implements PipeTransform {

  transform(start: Date, end: Date): string {
    if (start) {
      let duration: number;
      if (end) {
        duration = end.getTime() - start.getTime();
      } else {
        duration = new Date().getTime() - start.getTime();
      }
      return Math.floor(duration/3600000) + "h " +
        Math.floor(duration/60000)%60 + "m";
    }
  }
}
