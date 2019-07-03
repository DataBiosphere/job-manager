import {Component, Input, OnInit} from '@angular/core';

import {FailureMessage} from "../../../shared/model/FailureMessage";

@Component({
  selector: 'jm-failures-table',
  templateUrl: './failures-table.component.html',
  styleUrls: ['./failures-table.component.css']
})
export class JobFailuresTableComponent implements OnInit {
  @Input() failures: FailureMessage[];
  @Input() jobId: string;
  @Input() showHeaders: boolean;
  @Input() numToShow: number;
  @Input() displayedColumns: string[];
  @Input() context: string[];

  dataSource: FailureMessage[];

  ngOnInit() {
    this.dataSource = this.failures.slice(0, this.numToShow);
  }
}
