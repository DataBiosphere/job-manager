import {Component, Input} from "@angular/core";

@Component({
    selector: 'jm-datetime',
    templateUrl: './datetime.component.html',
    styleUrls: ['./datetime.component.css'],
    standalone: false
})
export class DatetimeComponent {
  @Input() datetime: Date;
}
