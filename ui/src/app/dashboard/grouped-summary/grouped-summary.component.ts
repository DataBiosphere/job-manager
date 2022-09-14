import {Component, Input, OnInit} from '@angular/core';
import {JobStatus} from "../../shared/model/JobStatus";
import {AggregationEntry} from "../../shared/model/AggregationEntry";
import {Aggregation} from "../../shared/model/Aggregation";
import {ActivatedRoute} from "@angular/router";
import {URLSearchParamsUtils} from "../../shared/utils/url-search-params.utils";
import {JobStatusIcon} from "../../shared/common";
import {Sort} from "@angular/material/sort";
import {TimeFrame} from "../../shared/model/TimeFrame";

const LABEL_KEY = 'label';
const DEFAULT_NUM_ROW = 5;

enum CardStatus {
  EXPANDED = 'expanded',
  COLLAPSED = 'collapsed',
  NONE = ''
}

@Component({
  selector: 'jm-grouped-summary',
  templateUrl: './grouped-summary.component.html',
  styleUrls: ['./grouped-summary.component.css']
})
export class GroupedSummaryComponent implements OnInit {
  @Input() aggregation: Aggregation;
  @Input() statusArray: Array<JobStatus>;
  @Input() timeFrame: TimeFrame;

  displayedAggregationEntries = new Array<Map<string, string>>();
  originalAggregationEntries = new Array<Map<string, string>>();

  labelKey = LABEL_KEY;
  cardClass = CardStatus.NONE;

  expanded = false;

  // make this variable accessible
  numRowsToDisplay = DEFAULT_NUM_ROW;

  constructor(private readonly activatedRoute:ActivatedRoute) {}

  ngOnInit() {
    for (let entry of this.aggregation.entries) {
      let statusCounts = this.convertToStatusCountsMap(entry);
      let row = new Map();
      for (let targetStatus of this.statusArray) {
        if (statusCounts.has(targetStatus)) {
          row.set(targetStatus, statusCounts.get(targetStatus));
        } else {
          row.set(targetStatus, 0);
        }
      }
      row.set(LABEL_KEY, entry.label);
      this.displayedAggregationEntries.push(row);
    }
    // make a copy of original data
    this.originalAggregationEntries = this.displayedAggregationEntries.slice();

    if (this.originalAggregationEntries.length > DEFAULT_NUM_ROW) {
      this.cardClass = CardStatus.COLLAPSED;
    }
  }

  private convertToStatusCountsMap(entry: AggregationEntry) {
    let statusCountsMap = new Map();
    for (let countEntry of entry.statusCounts.counts) {
      statusCountsMap.set(countEntry.status, countEntry.count);
    }
    return statusCountsMap;
  }

  getLabelUrlParams(entry: Map<string, string>) {
    let map = this.getCommonUrlParamsMap(entry);
    return {q: URLSearchParamsUtils.encodeURLSearchParamsFromMap(map)};
  }

  getStatusUrlParams(entry: Map<string, string>, status: JobStatus) {
    let map = this.getCommonUrlParamsMap(entry);
    map.set('status', [status.toString()]);
    return {q: URLSearchParamsUtils.encodeURLSearchParamsFromMap(map)};
  }

  getCommonUrlParamsMap(entry: Map<string, string>) {
    let map = new Map<string, string[]>();
    const projectId = URLSearchParamsUtils.unpackURLSearchParams(this.activatedRoute.snapshot.queryParams['q'])
      .extensions['projectId'];

    map.set('projectId', [projectId]);
    map.set(this.aggregation.key, [entry.get('label')]);

    const startTime = URLSearchParamsUtils.getStartTimeByTimeFrame(this.timeFrame);
    if (startTime) {
      map.set('start', [startTime.toLocaleDateString()]);
    }

    return map;
  }

  getStatusIcon(status: JobStatus): string {
    return JobStatusIcon[status];
  }

  sortData(sort: Sort) {
    const data = this.originalAggregationEntries.slice();
    if (!sort.active || sort.direction === '') {
      this.displayedAggregationEntries = data;
      return;
    }

    this.displayedAggregationEntries = data.sort((a, b) => {
      const isAsc = sort.direction === 'asc';
      if (!sort.active) {
        return 0;
      }
      return (a.get(sort.active) < b.get(sort.active) ? -1: 1) * (isAsc ? 1 : -1);
    });
  }

  onArrowClick() {
    this.expanded = !this.expanded;
    if (this.expanded) {
      this.cardClass = CardStatus.EXPANDED;
      this.numRowsToDisplay = this.originalAggregationEntries.length;
    } else {
      this.numRowsToDisplay = DEFAULT_NUM_ROW;
      this.cardClass = CardStatus.COLLAPSED;
    }
  }

  getAnchorClass(entry: Map<JobStatus, number>, status: JobStatus) {
    if (entry.get(status) == 0) {
      return 'zero'
    } else {
      return ''
    }
  }

  displayCollapseArrow(): boolean {
    return this.originalAggregationEntries.length > DEFAULT_NUM_ROW;
  }
}
