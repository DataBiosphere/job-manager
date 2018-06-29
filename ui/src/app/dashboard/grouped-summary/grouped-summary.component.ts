import {Component, Input} from '@angular/core';
import {JobStatus} from "../../shared/model/JobStatus";
import {AggregationEntry} from "../../shared/model/AggregationEntry";
import {Aggregation} from "../../shared/model/Aggregation";
import {ActivatedRoute} from "@angular/router";
import {URLSearchParamsUtils} from "../../shared/utils/url-search-params.utils";

@Component({
  selector: 'jm-grouped-summary',
  templateUrl: './grouped-summary.component.html',
  styleUrls: ['./grouped-summary.component.css']
})
export class GroupedSummaryComponent {
  @Input() aggregation: Aggregation;
  @Input() statusArray: Array<JobStatus>;

  constructor(private readonly activatedRoute:ActivatedRoute) {}

  convertCountsToMap(entry: AggregationEntry) : Map<JobStatus, number> {
    let countMap = new Map();
    for(let countEntry of entry.statusCounts.counts) {
      countMap.set(countEntry.status, countEntry.count);
    }
    return countMap;
  }

  getLabelUrlParams(entry: AggregationEntry) {
    let map = this.getCommonUrlParamsMap(entry);
    return {q: URLSearchParamsUtils.encodeURLSearchParamsFromMap(map)};
  }

  getStatusUrlParams(entry: AggregationEntry, status: JobStatus) {
    let map = this.getCommonUrlParamsMap(entry);
    map.set('statuses', [status.toString()]);
    return {q: URLSearchParamsUtils.encodeURLSearchParamsFromMap(map)};
  }

  getCommonUrlParamsMap(entry: AggregationEntry) {
    let map = new Map<string, string[]>();

    const projectId = URLSearchParamsUtils.unpackURLSearchParams(this.activatedRoute.snapshot.queryParams['q']).extensions['projectId'];

    map.set('projectId', [projectId]);
    map.set(this.aggregation.key, [entry.label]);

    return map;
  }
}
