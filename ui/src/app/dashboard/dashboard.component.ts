import { Component, OnInit } from '@angular/core';
import {ActivatedRoute} from "@angular/router";
import {AggregationResponse} from "../shared/model/AggregationResponse";
import {JobStatus} from "../shared/model/JobStatus";
import {TimeFrame} from "../shared/model/TimeFrame";

@Component({
  selector: 'jm-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  aggregationResponse: AggregationResponse;
  statusArray: Array<JobStatus> = [JobStatus.Succeeded, JobStatus.Aborted, JobStatus.Running, JobStatus.Failed];
  selectedTimeFrame = TimeFrame.DAYS7;
  timeFrames: Array<TimeFrame> = [TimeFrame.HOURS1, TimeFrame.HOURS8, TimeFrame.HOURS24,
  TimeFrame.DAYS7, TimeFrame.DAYS30, TimeFrame.ALLTIME];
  timeFrameMapping = new Map<TimeFrame, string> ([
    [TimeFrame.HOURS1, 'in past 1 hour'],
    [TimeFrame.HOURS8, 'in past 8 hours'],
    [TimeFrame.HOURS24, 'in past 24 hours'],
    [TimeFrame.DAYS7, 'in past 7 days'],
    [TimeFrame.DAYS30, 'in past 30 days'],
    [TimeFrame.ALLTIME, 'in past all time'],
  ]);

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

  onTimeFrameChange(newTimeFrame: TimeFrame) {
    this.selectedTimeFrame = newTimeFrame;
    this.aggregationResponse = this.activatedRoute.snapshot.data['aggregations'];
  }
}
