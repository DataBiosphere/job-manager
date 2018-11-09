import {Component, EventEmitter, Input, OnInit, Output} from "@angular/core";

@Component({
  selector: 'jm-enum-selection',
  templateUrl: './enum-selection.component.html',
})
export class EnumSelectionComponent implements OnInit {
  @Input() initialChipValue: string;
  @Input() chipKey: string;
  @Input() chipOptions: string[];
  @Output() updateValue: EventEmitter<string> = new EventEmitter();

  currentChipValue: string;

  ngOnInit(): void {
    if (this.initialChipValue != null) {
      this.currentChipValue = this.initialChipValue;
    }
  }

  changeOption(optionValue: string) {
    this.currentChipValue = optionValue;
    this.updateValue.emit(this.currentChipValue);
  }

  isChecked(option: string): boolean {
    if (this.currentChipValue === null) {
      return false;
    }
    return this.currentChipValue == option;
  }
}
