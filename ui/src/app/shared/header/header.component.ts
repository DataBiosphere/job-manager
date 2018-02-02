import {Component, NgZone, OnInit, ViewChild} from '@angular/core';
import {ENTER} from '@angular/cdk/keycodes';
import {FormControl} from "@angular/forms";
import {Observable} from "rxjs/Observable";

import {URLSearchParamsUtils} from "../url-search-params.utils";
import {ActivatedRoute, Router} from "@angular/router";
import {JobStatus} from "../model/JobStatus";
import {QueryJobsRequest} from "../model/QueryJobsRequest";
import {environment} from "../../../environments/environment";
import {dateColumns, endCol, queryFields, startCol, statusesCol} from "../common";
import {MatMenuTrigger} from "@angular/material";

@Component({
  selector: 'jm-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
})
export class HeaderComponent implements OnInit {
  @ViewChild(MatMenuTrigger) chipMenuTrigger: MatMenuTrigger;

  separatorKeysCodes = [ENTER];
  control: FormControl = new FormControl();
  options: string[] = [];
  chips: Map<string, string>;
  currentChipKey: string = "";
  currentChipValue: string = "";
  inputValue: string = "";
  jobStatuses: JobStatus[] = Object.keys(JobStatus).map(k => JobStatus[k]);
  selectedStatuses: JobStatus[] = [];

  filteredOptions: Observable<string[]>;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private zone: NgZone,
  ) {
    route.queryParams.subscribe(
      params => this.refreshChips(params['q']))
  }

  ngOnInit(): void {
    if (this.route.snapshot.queryParams['q']) {
      this.chips = URLSearchParamsUtils.getChips(this.route.snapshot.queryParams['q']);
    }
    if (this.chips.get(statusesCol)) {
      this.selectedStatuses = this.chips.get(statusesCol).split(',').map(k => JobStatus[k]);
    }
    this.filterOptions();
    this.options = URLSearchParamsUtils.getQueryFields();
    if (environment.additionalColumns) {
      this.options = this.options.concat(environment.additionalColumns);
    }
  }

  addChip(value: string): void {
    if ((value || '').trim()) {
      if (value.split(':').length == 2) {
        // Parse as a full key:value pair
        let keyVal: string[] = value.split(':');
        this.deleteChipIfExists(keyVal[0].trim());
        this.chips.set(keyVal[0].trim(), keyVal[1].trim());
      }
      else {
        // Parse as just the key
        this.deleteChipIfExists(value);
        this.chips.set(value.trim(), '');
      }
      this.inputValue = "";
    }
  }

  assignChipValue(): void {
    this.removeChip(this.currentChipKey);
    this.chips.set(this.currentChipKey, this.currentChipValue);
    if (this.chipMenuTrigger) {
      this.chipMenuTrigger.closeMenu();
    }
  }

  assignDateValue(date: Date): void {
    this.removeChip(this.currentChipKey);
    this.chips.set(this.currentChipKey, date.toLocaleDateString());
    if (this.chipMenuTrigger) {
      this.chipMenuTrigger.closeMenu();
    }
  }

  changeStatus(status: JobStatus, checked: boolean) {
    if (checked) {
      this.selectedStatuses.push(status);
    } else if (this.selectedStatuses.indexOf(status) > -1) {
      this.selectedStatuses.splice(this.selectedStatuses.indexOf(status), 1);
    }
    this.chips.set(statusesCol, this.selectedStatuses.join(','));
  }

  filter(val: string): string[] {
    return this.options.filter(option =>
      option.toLowerCase().indexOf(val.toLowerCase()) === 0);
  }

  filterOptions(): void {
    this.filteredOptions = this.control.valueChanges
      .startWith(null)
      .map(val => val ? this.filter(val) : this.options.slice());
  }

  getChipKeys(): string[] {
    return Array.from(this.chips.keys());
  }

  getCurrentChipType(): string {
    if (dateColumns.indexOf(this.currentChipKey) > -1) {
      return "date";
    }
    else if (this.currentChipKey == statusesCol) {
      return "statuses";
    }
    return "free text";
  }

  getDatePlaceholder(): string {
    if (this.currentChipKey == startCol) {
      return "Jobs on or after...";
    } else if (this.currentChipKey == endCol) {
      return "Jobs on or before..."
    }
  }

  getDisplayValue(chipKey: string) {
    return chipKey + ': ' + this.chips.get(chipKey);
  }

  isChecked(status: JobStatus): boolean {
    return this.selectedStatuses.indexOf(status) > -1;
  }

  navigateWithStatus(statuses: JobStatus[]): void {
    let query: QueryJobsRequest =
      URLSearchParamsUtils.unpackURLSearchParams(this.route.snapshot.queryParams['q']);
    query.statuses = statuses;
    this.selectedStatuses = statuses;
    this.router.navigate(
      ['jobs'],
      {queryParams: { q: URLSearchParamsUtils.encodeURLSearchParams(query)}}
    );
  }

  removeChip(chipKey: string): void {
    this.chips.delete(chipKey);
    if (chipKey == statusesCol) {
      this.selectedStatuses = [];
    }
  }

  // TODO: Cut the dependency on string parsing to represent lists here
  search(): void {
    let paramMap: Map<string, string[]> = new Map();
    this.chips.forEach((value: string, key: string) => {
      paramMap.set(key, value.split(','));
    });
    let query: string = URLSearchParamsUtils.encodeURLSearchParamsFromMap(paramMap);
    this.router.navigate(
      ['jobs'],
      {queryParams: { q: query}}
    );
  }

  setCurrentChip(chipKey: string): void {
    this.currentChipKey = chipKey;
    this.currentChipValue = this.chips.get(chipKey);
  }

  shouldDisplayStatusButtons(): boolean {
    return !URLSearchParamsUtils.unpackURLSearchParams(
      this.route.snapshot.queryParams['q'])[queryFields.statuses];
  }

  showActiveJobs(): void {
    this.navigateWithStatus([JobStatus.Submitted, JobStatus.Running, JobStatus.Aborting])
  }

  showCompletedJobs(): void {
    this.navigateWithStatus([JobStatus.Succeeded, JobStatus.Aborted]);
  }

  showFailedJobs(): void {
    this.navigateWithStatus([JobStatus.Failed]);
  }

  private refreshChips(query: string): void {
    this.zone.run(() => this.chips = URLSearchParamsUtils.getChips(query));
  }

  private deleteChipIfExists(key: string): void {
    if (this.chips.has(key)) {
      this.chips.delete(key);
    }
  }
}
