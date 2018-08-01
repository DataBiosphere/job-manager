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

@Component({
  selector: 'jm-grouped-summary',
  templateUrl: './grouped-summary.component.html',
  styleUrls: ['./grouped-summary.component.css']
})
export class GroupedSummaryComponent implements OnInit{
  @Input() aggregation: Aggregation;
  @Input() statusArray: Array<JobStatus>;
  aggregationEntries = [];
  unsortedAggregationEntries = [];

  labelKey = LABEL_KEY;
  expand = false;

  displayCollapseArrow = false;
  iconTransform = 'rotate(180deg)';
  paddingBottom = '';

  displayNumRow = DEFAULT_NUM_ROW;
  minDisplayNumRow = DEFAULT_NUM_ROW;

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
      this.aggregationEntries.push(row);
    }
    // make a copy of original data
    this.unsortedAggregationEntries = this.aggregationEntries.slice();

    if (this.unsortedAggregationEntries.length > this.minDisplayNumRow) {
      this.displayCollapseArrow = true;
      this.paddingBottom = '0.2rem';
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
    const data = this.unsortedAggregationEntries.slice();
    if (!sort.active || sort.direction === '') {
      this.aggregationEntries = data;
      return;
    }

    this.aggregationEntries = data.sort((a, b) => {
      const isAsc = sort.direction === 'asc';
      switch (sort.active) {
        case 'label': return compare(a.get('label'), b.get('label'), isAsc);
        case 'Running': return compare(a.get('Running'), b.get('Running'), isAsc);
        case 'Aborted': return compare(a.get('Aborted'), b.get('Aborted'), isAsc);
        case 'Succeeded': return compare(a.get('Succeeded'), b.get('Succeeded'), isAsc);
        case 'Failed': return compare(a.get('Failed'), b.get('Failed'), isAsc);
        case 'Submitted': return compare(a.get('Submitted'), b.get('Submitted'), isAsc);
        case 'Aborting': return compare(a.get('Aborting'), b.get('Aborting'), isAsc);
        default: return 0;
      }
    });
  }

  onArrowClick() {
    this.expand = !this.expand;
    if (this.expand) {
      this.iconTransform = 'rotate(0deg)';
      this.displayNumRow = this.unsortedAggregationEntries.length;
    } else {
      this.displayNumRow = DEFAULT_NUM_ROW;
      this.iconTransform = 'rotate(180deg)';
    }
  }

}

function compare(a, b, isAsc) {
  return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
}
