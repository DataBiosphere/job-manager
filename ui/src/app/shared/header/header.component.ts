import {Component, NgZone, OnInit} from '@angular/core';
import {MdChipInputEvent} from '@angular/material';
import {ENTER} from '@angular/cdk/keycodes';
import {FormControl} from "@angular/forms";
import {Observable} from "rxjs/Observable";

import {URLSearchParamsUtils} from "../utils/url-search-params.utils";
import {ActivatedRoute, Router} from "@angular/router";
import {JobStatus} from "../model/JobStatus";
import {QueryJobsRequest} from "../model/QueryJobsRequest";
import {environment} from "../../../environments/environment";
import {queryFields} from "../common";

@Component({
  selector: 'jm-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
})
export class HeaderComponent implements OnInit {
  separatorKeysCodes = [ENTER];
  control: FormControl = new FormControl();
  options: string[] = [];
  currentChipKey: string = "";
  currentChipValue: string = "";
  inputValue: string = "";

  chips: Map<string, string>;

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

  getDisplayValue(chipKey: string) {
    return chipKey + ': ' + this.chips.get(chipKey);
  }

  navigateWithStatus(statuses: JobStatus[]): void {
    let query: QueryJobsRequest =
      URLSearchParamsUtils.unpackURLSearchParams(this.route.snapshot.queryParams['q']);
    query.statuses = statuses;
    this.router.navigate(
      ['jobs'],
      {queryParams: { q: URLSearchParamsUtils.encodeURLSearchParams(query)}}
    );
  }

  removeChip(chipKey: string): void {
    this.chips.delete(chipKey);
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
