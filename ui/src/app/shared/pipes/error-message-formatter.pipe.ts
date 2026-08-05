import {Pipe, PipeTransform} from '@angular/core';

@Pipe({
    name: 'jmErrorMessageFormatter',
    standalone: false
})
export class ErrorMessageFormatterPipe implements PipeTransform {
  transform(error: any): string {
    if ("title" in error && "status" in error && "message" in error) {
      return `${error["title"]} (${error["status"]}): ${error["message"]}`;
    }
    return undefined;
  }
}
