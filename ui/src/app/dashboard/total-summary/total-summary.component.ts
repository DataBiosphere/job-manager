import {Component, Input} from '@angular/core';
import {StatusCounts} from "../../shared/model/StatusCounts";
import {ActivatedRoute} from "@angular/router";
import {URLSearchParamsUtils} from "../../shared/utils/url-search-params.utils";
import {StatusCount} from "../../shared/model/StatusCount";

@Component({
  selector: 'jm-total-summary',
  templateUrl: './total-summary.component.html',
  styleUrls: ['./total-summary.component.css']
})
export class TotalSummaryComponent {
  @Input() summary: StatusCounts;

  constructor(private readonly activatedRoute: ActivatedRoute) {}

  getUrlParams(statusCount: StatusCount) {
    let map = new Map<string, string[]>();
    map.set('projectId', [this.activatedRoute.snapshot.queryParams['projectId']]);
    map.set('statuses', [statusCount.status.toString()]);

    return {q: URLSearchParamsUtils.encodeURLSearchParamsFromMap(map)};
  }

}
