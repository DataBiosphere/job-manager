import {Component, Input, OnInit} from '@angular/core';
import {AggregationResponse} from '../../shared/model/AggregationResponse';
import {JobStatus} from "../../shared/model/JobStatus";
import {AggregationEntry} from "../../shared/model/AggregationEntry";

@Component({
  selector: 'jm-grouped-summary',
  templateUrl: './grouped-summary.component.html',
  styleUrls: ['./grouped-summary.component.css']
})
export class GroupedSummaryComponent implements OnInit {
  @Input() aggregationResponse: AggregationResponse;

  statusArray: Array<JobStatus> = [];

  constructor() {
  }

  ngOnInit() {
    for (let countEntry of this.aggregationResponse.summary.counts) {
      console.log(countEntry.status);
      //TODO(zach): Seems that job status on the backend is not an enum type and it still fit in even if the
      // string is not one of the enum of JobStatus
      this.statusArray.push(countEntry.status);
    }
  }

  convertCountsToMap(entry: AggregationEntry) : Map<JobStatus, number> {
    let countMap = new Map();
    for(let countEntry of entry.statusCounts.counts) {
      countMap.set(countEntry.status, countEntry.count);
    }
    return countMap;
  }
}
