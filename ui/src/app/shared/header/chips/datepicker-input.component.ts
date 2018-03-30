import {Component, EventEmitter, Input, OnInit, Output} from "@angular/core";

@Component({
  selector: 'jm-datepicker-input',
  templateUrl: './datepicker-input.component.html',
  styleUrls: ['./filter-chip.component.css'],
})
export class DatepickerInputComponent implements OnInit {
  @Input() chipKey: string;
  @Input() initialChipValue: string;
  @Output() updateValue: EventEmitter<string> = new EventEmitter();

  currentChipValue: string;

  ngOnInit(): void {
    this.currentChipValue = this.initialChipValue;
  }

  getDatePlaceholder(): string {
    if (this.chipKey == 'start') {
      return 'Jobs started on or after...';
    } else if (this.chipKey == 'end') {
      return 'Jobs ended on or before...';
    } else if (this.chipKey == 'submission') {
      return 'Jobs submitted on or before...';
    }
  }

  assignDateValue(date: Date): void {
    this.updateValue.emit(date.toLocaleDateString());
  }
}
