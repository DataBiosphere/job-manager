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

  currentChipValues: string[];

  ngOnInit(): void {
    this.currentChipValues = this.trimOptions(this.initialChipValue.split(','));
  }

  changeOption(optionValue: string, checked: boolean) {
    if (checked) {
      this.currentChipValues.push(optionValue);
    } else if (this.isChecked(optionValue)) {
      this.currentChipValues.splice(this.currentChipValues.indexOf(optionValue), 1);
    }
    this.updateValue.emit(this.currentChipValues.join(','));
  }

  isChecked(status: string): boolean {
    return this.currentChipValues.indexOf(status) > -1;
  }

  trimOptions(options: string[]): string[] {
    let newOptions: string[] = [];
    options.forEach((option) => {
      if (option) {
        newOptions.push(option);
      }
    });
    return newOptions;
  }
}
