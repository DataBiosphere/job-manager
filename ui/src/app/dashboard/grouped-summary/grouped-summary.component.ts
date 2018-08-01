import {Component, Input, OnInit} from '@angular/core';
import {JobStatus} from "../../shared/model/JobStatus";
import {AggregationEntry} from "../../shared/model/AggregationEntry";
import {Aggregation} from "../../shared/model/Aggregation";
import {ActivatedRoute} from "@angular/router";
import {URLSearchParamsUtils} from "../../shared/utils/url-search-params.utils";
import {JobStatusIcon} from "../../shared/common";
import {Sort} from "@angular/material";

const LABEL_KEY = 'label';
const DEFAULT_NUM_ROW = 5;

enum CardStatus {
  EXPANDED = 'expanded',
  COLLAPSED = 'collapsed',
  NONE = 'none'
}

@Component({
  selector: 'jm-grouped-summary',
  templateUrl: './grouped-summary.component.html',
  styleUrls: ['./grouped-summary.component.css']
})
export class GroupedSummaryComponent implements OnInit{
  @Input() aggregation: Aggregation;
  @Input() statusArray: Array<JobStatus>;

  displayedAggregationEntries = [];
  originalAggregationEntries = [];

  labelKey = LABEL_KEY;
  expand = false;

  displayCollapseArrow = false;
  cardClass = CardStatus.NONE;

  numRowToDisplay = DEFAULT_NUM_ROW;

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
      this.displayCollapseArrow = true;
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

  getLabelUrlParams(entry) {
    let map = this.getCommonUrlParamsMap(entry);
    return {q: URLSearchParamsUtils.encodeURLSearchParamsFromMap(map)};
  }

  getStatusUrlParams(entry, status: JobStatus) {
    let map = this.getCommonUrlParamsMap(entry);
    map.set('statuses', [status.toString()]);
    return {q: URLSearchParamsUtils.encodeURLSearchParamsFromMap(map)};
  }

  getCommonUrlParamsMap(entry) {
    let map = new Map<string, string[]>();
    const projectId = URLSearchParamsUtils.unpackURLSearchParams(this.activatedRoute.snapshot.queryParams['q'])
      .extensions['projectId'];

    map.set('projectId', [projectId]);
    map.set(this.aggregation.key, [entry.get('label')]);

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
      switch (sort.active) {
        case 'label': return this.compare(a.get('label'), b.get('label'), isAsc);
        case 'Running': return this.compare(a.get('Running'), b.get('Running'), isAsc);
        case 'Aborted': return this.compare(a.get('Aborted'), b.get('Aborted'), isAsc);
        case 'Succeeded': return this.compare(a.get('Succeeded'), b.get('Succeeded'), isAsc);
        case 'Failed': return this.compare(a.get('Failed'), b.get('Failed'), isAsc);
        case 'Submitted': return this.compare(a.get('Submitted'), b.get('Submitted'), isAsc);
        case 'Aborting': return this.compare(a.get('Aborting'), b.get('Aborting'), isAsc);
        default: return 0;
      }
    });
  }

  onArrowClick() {
    if (this.cardClass == CardStatus.COLLAPSED) {
      this.cardClass = CardStatus.EXPANDED;
      this.numRowToDisplay = this.originalAggregationEntries.length;
    } else {
      this.numRowToDisplay = DEFAULT_NUM_ROW;
      this.cardClass = CardStatus.COLLAPSED;
    }
  }

  private compare(a, b, isAsc) {
    return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
  }
}
