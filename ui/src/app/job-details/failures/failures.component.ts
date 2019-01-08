import {Component, Input, OnInit, ViewChild} from '@angular/core';
import {FailureMessage} from "../../shared/model/FailureMessage";
import {JobFailuresTableComponent} from "../common/failures-table/failures-table.component";

@Component({
  selector: 'jm-failures',
  templateUrl: './failures.component.html',
  styleUrls: ['./failures.component.css']
})
export class JobFailuresComponent implements OnInit {
  @Input() failures: FailureMessage[];
  @ViewChild(JobFailuresTableComponent) failuresTable: JobFailuresTableComponent;

  changeToFailuresTab: boolean;
  public readonly numOfErrorsToShow = 2;
  expandPanel: boolean;

  ngOnInit() {
    this.expandPanel = true;
  }

  showAllErrors(): void {
    this.expandPanel = false;
    this.changeToFailuresTab = true;
  }
}
