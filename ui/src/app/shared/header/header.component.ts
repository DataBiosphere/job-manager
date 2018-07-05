import {BehaviorSubject} from 'rxjs/BehaviorSubject';
import {Subject} from 'rxjs/Subject';
import {
  AfterViewChecked,
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  Injectable,
  Input,
  NgZone,
  OnDestroy,
  OnInit, QueryList,
  ViewChild,
  ViewChildren
} from '@angular/core';
import {ENTER} from '@angular/cdk/keycodes';
import {FormControl} from '@angular/forms';
import {ActivatedRoute, Router} from '@angular/router';
import {Observable} from 'rxjs/Observable';
import {Subscription} from 'rxjs/Subscription';
import {
  MatAutocompleteTrigger,
  MatPaginator,
  MatPaginatorIntl,
  PageEvent,
} from '@angular/material';

import {CapabilitiesService} from '../../core/capabilities.service';
import {URLSearchParamsUtils} from '../utils/url-search-params.utils';
import {JobStatus} from '../model/JobStatus';
import {QueryJobsRequest} from '../model/QueryJobsRequest';
import {FieldDataType} from '../common';
import {JobListView} from '../job-stream';
import {FilterChipComponent} from "./chips/filter-chip.component";

@Component({
  selector: 'jm-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
})
export class HeaderComponent implements OnInit, AfterViewInit, AfterViewChecked, OnDestroy {
  @Input() jobs: BehaviorSubject<JobListView>;
  @Input() pageSize: number;
  @ViewChildren(FilterChipComponent) chipElements: QueryList<FilterChipComponent>;
  @ViewChild(MatAutocompleteTrigger) autocompleteTrigger: MatAutocompleteTrigger;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  public pageSubject: Subject<PageEvent> = new Subject<PageEvent>();
  private pageSubscription: Subscription;

  chipToExpand: string;
  separatorKeysCodes = [ENTER];
  control: FormControl = new FormControl();
  options: Map<string, FieldDataType>;
  chips: Map<string, string>;
  inputValue: string = '';

  filteredOptions: Observable<string[]>;

  private readonly activeStatuses = [JobStatus.Submitted, JobStatus.Running, JobStatus.Aborting];
  private readonly completedStatuses = [JobStatus.Succeeded, JobStatus.Aborted];
  private readonly failedStatuses = [JobStatus.Failed];

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly capabilitiesService: CapabilitiesService,
    private zone: NgZone,
    private cdr: ChangeDetectorRef,
  ) {
    route.queryParams.subscribe(params => this.refreshChips(params['q']));
  }

  ngOnInit(): void {
    if (this.route.snapshot.queryParams['q']) {
      this.chips = URLSearchParamsUtils.getChips(this.route.snapshot.queryParams['q']);
    }

    this.options = URLSearchParamsUtils.getQueryFields(
      this.capabilitiesService.getCapabilitiesSynchronous());
    this.filterOptions();
  }

  ngAfterViewInit(): void {
    // The @ViewChild property may not be initialized until after view init.
    if (this.paginator) {
      this.pageSubscription = this.paginator.page.subscribe(this.pageSubject);
    }
  }

  ngAfterViewChecked(): void {
    if (this.chipToExpand) {
      // Search for a newly added chip in the DOM now that it's been rendered
      this.chipElements.toArray().forEach((chip) => {
        if (chip.chipKey == this.chipToExpand) {
          chip.expandMenu();
        }
      });
      this.chipToExpand = null;
    }
    this.cdr.detectChanges();
  }

  ngOnDestroy(): void {
    if (this.pageSubscription) {
      this.pageSubscription.unsubscribe();
    }
  }

  public resetPagination() {
    if (this.paginator) {
      this.paginator.firstPage();
    }
  }

  addChip(value: string): void {
    this.autocompleteTrigger.closePanel();
    if ((value || '').trim()) {
      if (value.split(':').length == 2) {
        // Parse as a full key:value pair
        let keyVal: string[] = value.split(':');
        this.deleteChipIfExists(keyVal[0].trim());
        this.chips.set(keyVal[0].trim(), keyVal[1].trim());
        this.search();
      }
      else {
        // Parse as just the key
        this.deleteChipIfExists(value);
        this.chips.set(value.trim(), '');
        // This chip will be expanded via ngAfterViewChecked() once initialized
        this.chipToExpand = value.trim();
      }
      this.inputValue = '';
    }
  }

  filter(val: string): string[] {
    return Array.from(this.options.keys()).filter(option =>
      option.toLowerCase().indexOf(val.toLowerCase()) === 0);
  }

  filterOptions(): void {
    this.filteredOptions = Observable.create((s) => {
      s.next(Array.from(this.options.keys()));
      this.control.valueChanges.subscribe(v => s.next(this.filter(v)));
    });
  }

  getChipKeys(): string[] {
    return Array.from(this.chips.keys());
  }

  navigateWithStatus(statuses: JobStatus[]): void {
    this.chips.set('statuses', statuses.map((status) => JobStatus[status]).join(','));
    this.search();
  }

  removeChip(chipKey: string): void {
    this.chips.delete(chipKey);
    this.search();
  }

  updateValue(chipKey: string, chipValue: string): void {
    this.chips.set(chipKey, chipValue);
    this.search();
  }

  // TODO: Cut the dependency on string parsing to represent lists here
  search(): void {
    let paramMap: Map<string, string[]> = new Map();
    this.chips.forEach((value: string, key: string) => {
      if (value && value.length > 0) {
        paramMap.set(key, value.split(','));
      }
    });
    let query: string = URLSearchParamsUtils.encodeURLSearchParamsFromMap(paramMap);
    if (query) {
      this.router.navigate(
        ['jobs'],
        {queryParams: { q: query}}
      );
    } else {
      this.router.navigate(
        ['jobs']
      );
    }
  }

  shouldDisplayStatusButtons(): boolean {
    return !URLSearchParamsUtils.unpackURLSearchParams(
      this.route.snapshot.queryParams['q'])['statuses'];
  }

  shouldDisplayStatusCounts(): boolean {
    // Only show status counts if all jobs are loaded client-side.
    return this.jobs.value.exhaustive;
  }

  showActiveJobs(): void {
    this.navigateWithStatus(this.activeStatuses.slice())
  }

  showCompletedJobs(): void {
    this.navigateWithStatus(this.completedStatuses.slice())
  }

  showFailedJobs(): void {
    this.navigateWithStatus(this.failedStatuses.slice());
  }

  getActiveCount(): number {
    return this.jobs.value.results.filter(
      j => this.activeStatuses.includes(j.status)).length;
  }

  getFailedCount(): number {
    return this.jobs.value.results.filter(
      j => this.failedStatuses.includes(j.status)).length;
  }

  getCompletedCount(): number {
    return this.jobs.value.results.filter(
      j => this.completedStatuses.includes(j.status)).length;
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

