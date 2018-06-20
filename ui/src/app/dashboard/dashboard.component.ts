import { Component, OnInit } from '@angular/core';
import {ActivatedRoute} from "@angular/router";
import {AggregationResponse} from "../shared/model/AggregationResponse";
import {JobStatus} from "../shared/model/JobStatus";

@Component({
  selector: 'jm-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  aggregationResponse: AggregationResponse;
  statusArray: Array<JobStatus> = [];

  constructor(private readonly activatedRoute: ActivatedRoute) {}

  ngOnInit() {
    this.aggregationResponse = this.activatedRoute.snapshot.data['aggregations'];

    // collect status
    for (let countEntry of this.aggregationResponse.summary.counts) {
      //TODO(zach): Seems that job status on the backend is not an enum type and it still fit in even if the
      // string is not one of the enum of JobStatus
      this.statusArray.push(countEntry.status);
    }
  }

}
