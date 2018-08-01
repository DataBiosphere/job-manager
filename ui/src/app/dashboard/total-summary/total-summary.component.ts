import {Component, Input, OnInit} from '@angular/core';
import {StatusCounts} from "../../shared/model/StatusCounts";
import {ActivatedRoute} from "@angular/router";
import {URLSearchParamsUtils} from "../../shared/utils/url-search-params.utils";
import {StatusCount} from "../../shared/model/StatusCount";
import {JobStatusIcon} from "../../shared/common";
import {JobStatus} from "../../shared/model/JobStatus";

@Component({
  selector: 'jm-total-summary',
  templateUrl: './total-summary.component.html',
  styleUrls: ['./total-summary.component.css']
})
export class TotalSummaryComponent implements OnInit {
  @Input() summary: StatusCounts;
  @Input() statusArray: Array<JobStatus>;
  statusCountsMap = new Map<JobStatus, number>();

  constructor(private readonly activatedRoute: ActivatedRoute) {}

  ngOnInit(): void {
    for (let statusCount of this.summary.counts) {
      this.statusCountsMap.set(statusCount.status, statusCount.count);
    }

    for (let status of this.statusArray) {
      if (!this.statusCountsMap.has(status)) {
        this.statusCountsMap.set(status, 0);
      }
    }
  }

  getUrlParams(status: JobStatus) {
    let query = URLSearchParamsUtils.unpackURLSearchParams(this.activatedRoute.snapshot.queryParams['q']);
    query.statuses = [status];
    return {q: URLSearchParamsUtils.encodeURLSearchParams(query)};
  }

  getStatusIcon(status: JobStatus): string {
    return JobStatusIcon[status];
  }
}
