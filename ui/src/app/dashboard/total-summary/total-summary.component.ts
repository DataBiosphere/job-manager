import {Component, Input, OnChanges, OnInit, SimpleChanges} from '@angular/core';
import {StatusCounts} from "../../shared/model/StatusCounts";
import {ActivatedRoute} from "@angular/router";
import {URLSearchParamsUtils} from "../../shared/utils/url-search-params.utils";
import {JobStatusIcon} from "../../shared/common";
import {JobStatus} from "../../shared/model/JobStatus";
import {TimeFrame} from "../../shared/model/TimeFrame";

@Component({
  selector: 'jm-total-summary',
  templateUrl: './total-summary.component.html',
  styleUrls: ['./total-summary.component.css']
})
export class TotalSummaryComponent implements OnInit, OnChanges {
  @Input() summary: StatusCounts;
  @Input() statusArray: Array<JobStatus>;
  @Input() timeFrame: TimeFrame;

  statusCountsMap = new Map<JobStatus, number>();

  constructor(private readonly activatedRoute: ActivatedRoute) {}

  ngOnInit(): void {
    this.updateStatusCountsMap(this.summary);
  }

  ngOnChanges(changes: SimpleChanges): void {
    // return if onInit() has not been called
    if (changes['summary'] == null) {
      return;
    }
    console.log(changes['summary']);
    this.updateStatusCountsMap(changes['summary'].currentValue);
  }

  updateStatusCountsMap(summary: StatusCounts) {
    let newStatusCountsMap = new Map<JobStatus, number>();
    for (let statusCount of summary.counts) {
      newStatusCountsMap.set(statusCount.status, statusCount.count);
    }

    for (let status of this.statusArray) {
      if (!newStatusCountsMap.has(status)) {
        newStatusCountsMap.set(status, 0);
      }
    }
    this.statusCountsMap = newStatusCountsMap;
  }

  getUrlParams(status: JobStatus) {
    const query = URLSearchParamsUtils.unpackURLSearchParams(this.activatedRoute.snapshot.queryParams['q']);

    let map = new Map<string, string[]>();
    map.set('statuses', [status.toString()]);
    map.set('projectId', [query.extensions.projectId]);
    const startTime = URLSearchParamsUtils.getStartTimeByTimeFrame(this.timeFrame);
    if (startTime != "") {
      map.set('start', [startTime]);
    }

    return {q: URLSearchParamsUtils.encodeURLSearchParamsFromMap(map)};
  }

  getStatusIcon(status: JobStatus): string {
    return JobStatusIcon[status];
  }
}
