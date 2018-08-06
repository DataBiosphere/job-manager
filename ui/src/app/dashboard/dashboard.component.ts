import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from "@angular/router";
import {AggregationResponse} from "../shared/model/AggregationResponse";
import {JobStatus} from "../shared/model/JobStatus";
import {TimeFrame} from "../shared/model/TimeFrame";
import {URLSearchParamsUtils} from "../shared/utils/url-search-params.utils";
import {defaultTimeFrame, timeFrameToDescriptionMap} from "../shared/time-frame";

@Component({
  selector: 'jm-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  aggregationResponse: AggregationResponse;
  statusArray: Array<JobStatus> = [JobStatus.Succeeded, JobStatus.Aborted, JobStatus.Running, JobStatus.Failed];
  timeFrameToDescriptionMap = timeFrameToDescriptionMap;

  selectedTimeFrame = defaultTimeFrame;
  timeFrames: Array<TimeFrame> = [TimeFrame.HOURS1, TimeFrame.HOURS8, TimeFrame.HOURS24,
    TimeFrame.DAYS7, TimeFrame.DAYS30, TimeFrame.ALLTIME];

  constructor(private readonly router: Router,
              private readonly activatedRoute: ActivatedRoute) {}

  ngOnInit() {
    this.activatedRoute.queryParams.subscribe(() => this.reloadAggregations());

    // make the default toggle option match to url param
    if (this.activatedRoute.snapshot.queryParams['timeFrame'] != null) {
      this.selectedTimeFrame = this.activatedRoute.snapshot.queryParams['timeFrame'];
    }
  }

  reloadAggregations() {
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
    const extras = {
      queryParams:
        {
          q: URLSearchParamsUtils.encodeURLSearchParams({
            extensions: {
              projectId: 'bvdp-jmui-testing'
            }}),
          timeFrame: this.selectedTimeFrame
        }
    };

    this.router.navigate(['dashboard'], extras);
  }
}
