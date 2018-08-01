import {Component, OnInit} from '@angular/core';
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
  statusArray: Array<JobStatus> = [JobStatus.Succeeded, JobStatus.Aborted, JobStatus.Running, JobStatus.Failed];

  constructor(private readonly activatedRoute: ActivatedRoute) {}

  ngOnInit() {
    this.aggregationResponse = this.activatedRoute.snapshot.data['aggregations'];

    // collect status
    for (let countEntry of this.aggregationResponse.summary.counts) {
      if (!this.statusArray.includes(countEntry.status)) {
        this.statusArray.push(countEntry.status);
      }
    }
  }
}
