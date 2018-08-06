import {Component, Input, OnChanges, OnInit, SimpleChanges} from '@angular/core';
import {StatusCounts} from "../../shared/model/StatusCounts";
import {ActivatedRoute} from "@angular/router";
import {URLSearchParamsUtils} from "../../shared/utils/url-search-params.utils";
import {StatusCount} from "../../shared/model/StatusCount";
import {JobStatusIcon} from "../../shared/common";
import {JobStatus} from "../../shared/model/JobStatus";
import {AggregationResponse} from "../../shared/model/AggregationResponse";

@Component({
  selector: 'jm-total-summary',
  templateUrl: './total-summary.component.html',
  styleUrls: ['./total-summary.component.css']
})
export class TotalSummaryComponent implements OnInit, OnChanges {
  @Input() summary: StatusCounts;
  @Input() statusArray: Array<JobStatus>;
  statusCountsMap = new Map<JobStatus, number>();

  constructor(private readonly activatedRoute: ActivatedRoute) {}

  ngOnInit(): void {
    this.updateStatusCountsMap(this.summary);
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
    let query = URLSearchParamsUtils.unpackURLSearchParams(this.activatedRoute.snapshot.queryParams['q']);
    query.statuses = [status];
    return {q: URLSearchParamsUtils.encodeURLSearchParams(query)};
  }

  getStatusIcon(status: JobStatus): string {
    return JobStatusIcon[status];
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.updateStatusCountsMap(changes['summary'].currentValue);
  }
}
