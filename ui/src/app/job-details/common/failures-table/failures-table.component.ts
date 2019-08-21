import {Component, Input, OnInit} from '@angular/core';

import {FailureMessage} from "../../../shared/model/FailureMessage";
import {ActivatedRoute, Params} from "@angular/router";

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

  constructor(
    private readonly route: ActivatedRoute) { }

  ngOnInit() {
    this.dataSource = this.failures.slice(0, this.numToShow);
  }

  getQueryString(): string {
    if (this.route.snapshot.queryParams.q) {
      return '?q=' + encodeURIComponent(this.route.snapshot.queryParams.q);
    }
  }
}
