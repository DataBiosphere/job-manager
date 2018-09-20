import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ViewChild
} from "@angular/core";
import {FieldDataType} from "../../common";
import {URLSearchParamsUtils} from "../../utils/url-search-params.utils";
import {CapabilitiesService} from "../../../core/capabilities.service";
import {MatMenuTrigger} from "@angular/material";
import {DatepickerInputComponent} from "./datepicker-input.component";

@Component({
  selector: 'jm-filter-chip',
  templateUrl: './filter-chip.component.html',
  styleUrls: ['./filter-chip.component.css'],
})
export class FilterChipComponent implements OnInit {
  @Input() chipKey: string;
  @Input() initialChipValue: string;
  @Output() updateValue: EventEmitter<string> = new EventEmitter();
  @Output() removeChip: EventEmitter<null> = new EventEmitter();

  @ViewChild('freeTextInput') freeTextInput: ElementRef;
  @ViewChild(MatMenuTrigger) chipMenuTrigger: MatMenuTrigger;
  @ViewChild(DatepickerInputComponent) datePickerInput: DatepickerInputComponent;

  currentChipValue: string;
  options: Map<string, FieldDataType>;

  constructor(
    private readonly capabilitiesService: CapabilitiesService,
  ) {}

  ngOnInit(): void {
    this.options = URLSearchParamsUtils.getQueryFields(
      this.capabilitiesService.getCapabilitiesSynchronous());
    this.currentChipValue = this.initialChipValue;
  }

  focusInput() {
    if (this.freeTextInput) {
      this.freeTextInput.nativeElement.focus();
    } else if (this.datePickerInput) {
      // Wait for the form expansion animation to complete before expanding the calendar
      setTimeout(() => this.datePickerInput.expandCalendar(), 100);
    } else if (this.getCurrentChipType() == 'Boolean') {
      this.chipMenuTrigger.closeMenu();
    }
  }

  getCurrentChipType(): string {
    if (this.chipKey && this.options.has(this.chipKey)) {
      return FieldDataType[this.options.get(this.chipKey)];
    }
    // Default to text for all labels
    return FieldDataType[FieldDataType.Text];
  }

  getDisplayValue() {
    return this.chipKey + ': ' + this.currentChipValue;
  }

  removeThisChip(): void {
    this.removeChip.emit(null);
  }

  setChipValue(value: string): void {
    if (value) {
      this.chipMenuTrigger.closeMenu();
      this.currentChipValue = value;
      this.updateValue.emit(this.currentChipValue);
    }
  }

  expandMenu() {
    this.chipMenuTrigger.openMenu();
    this.focusInput();
  }

}
