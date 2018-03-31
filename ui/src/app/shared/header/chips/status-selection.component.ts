import {JobStatus} from "../../model/JobStatus";
import {Component, EventEmitter, Input, OnInit, Output} from "@angular/core";

@Component({
  selector: 'jm-status-selection',
  templateUrl: './status-selection.component.html',
})
export class StatusSelectionComponent implements OnInit {
  @Input() initialChipValue: string;
  @Output() updateValue: EventEmitter<string> = new EventEmitter();

  currentChipValues: string[];
  jobStatuses: string[] = Object.keys(JobStatus);

  ngOnInit(): void {
    this.currentChipValues = this.initialChipValue.split(',');
  }

  changeStatus(status: string, checked: boolean) {
    if (checked) {
      this.currentChipValues.push(status);
    } else if (this.isChecked(status)) {
      this.currentChipValues.splice(this.currentChipValues.indexOf(status), 1);
    }
    this.updateValue.emit(this.currentChipValues.join(','));
  }

  isChecked(status: string): boolean {
    return this.currentChipValues.indexOf(status) > -1;
  }
}
