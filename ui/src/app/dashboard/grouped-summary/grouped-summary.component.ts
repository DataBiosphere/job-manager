import {Component, Input} from '@angular/core';
import {JobStatus} from "../../shared/model/JobStatus";
import {AggregationEntry} from "../../shared/model/AggregationEntry";
import {Aggregation} from "../../shared/model/Aggregation";

@Component({
  selector: 'jm-grouped-summary',
  templateUrl: './grouped-summary.component.html',
  styleUrls: ['./grouped-summary.component.css']
})
export class GroupedSummaryComponent {
  @Input() aggregation: Aggregation;
  @Input() statusArray: Array<JobStatus>;

  constructor() {}

  convertCountsToMap(entry: AggregationEntry) : Map<JobStatus, number> {
    let countMap = new Map();
    for(let countEntry of entry.statusCounts.counts) {
      countMap.set(countEntry.status, countEntry.count);
    }
    return countMap;
  }
}
