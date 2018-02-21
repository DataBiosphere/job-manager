import {BehaviorSubject} from 'rxjs/BehaviorSubject';
import {Subject} from 'rxjs/Subject';
import {
  AfterViewInit,
  Component,
  EventEmitter,
  Injectable,
  Input,
  NgZone,
  OnDestroy,
  OnInit,
  Output,
  ViewChild
} from '@angular/core';
import {ENTER} from '@angular/cdk/keycodes';
import {FormControl} from "@angular/forms";
import {ActivatedRoute, Router} from "@angular/router";
import {Observable} from "rxjs/Observable";
import {Subscription} from 'rxjs/Subscription';
import {
  MatPaginator,
  MatPaginatorIntl,
  MatSnackBar,
  PageEvent
} from '@angular/material';

import {CapabilitiesService} from "../../core/capabilities.service";
import {URLSearchParamsUtils} from "../utils/url-search-params.utils";
import {JobStatus} from "../model/JobStatus";
import {QueryJobsRequest} from "../model/QueryJobsRequest";
import {environment} from "../../../environments/environment";
import {FieldDataType, queryDataTypes, queryExtensionsDataTypes} from "../common";
import {MatMenuTrigger} from "@angular/material";
import {JobListView} from '../job-stream';

@Component({
  selector: 'jm-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
})
export class HeaderComponent implements OnInit, AfterViewInit, OnDestroy {
  // Whether the status tabs and pagination controls are displayed. If true,
  // jobs and pageSize must also be provided.
  @Input() showControls: boolean = false;
  @Input() jobs: BehaviorSubject<JobListView>;
  @Input() pageSize: number;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  public pageSubject: Subject<PageEvent> = new Subject<PageEvent>();
  private pageSubscription: Subscription;

  @ViewChild(MatMenuTrigger) chipMenuTrigger: MatMenuTrigger;

  separatorKeysCodes = [ENTER];
  control: FormControl = new FormControl();
  options: Map<string, FieldDataType>;
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
    private readonly capabilitiesService: CapabilitiesService,
    private zone: NgZone,
  ) {
    route.queryParams.subscribe(params => this.refreshChips(params['q']));
  }

  ngOnInit(): void {
    if (this.route.snapshot.queryParams['q']) {
      this.chips = URLSearchParamsUtils.getChips(this.route.snapshot.queryParams['q']);
    }
    if (this.chips.get("statuses")) {
      this.selectedStatuses = this.chips.get("statuses").split(',').map(k => JobStatus[k]);
    }

    this.capabilitiesService.getCapabilities().then(capabilities => {
      this.options = URLSearchParamsUtils.getQueryFields(capabilities);
      this.filterOptions();
    });
  }

  ngAfterViewInit(): void {
    // The @ViewChild property may not be initialized until after view init.
    if (this.paginator) {
      // Our paginator details depend on the state of backend pagination,
      // therefore we cannot simply inject an alternate MatPaginatorIntl, as
      // recommended by the paginator documentation. _intl is public, and
      // overwriting it seems preferable to providing our own version of
      // MatPaginator.
      this.paginator._intl = new JobsPaginatorIntl(
          this.jobs, this.paginator._intl.changes);
      this.pageSubscription = this.paginator.page.subscribe(this.pageSubject);
    }
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
    this.search();
  }

  assignDateValue(date: Date): void {
    this.removeChip(this.currentChipKey);
    this.chips.set(this.currentChipKey, date.toLocaleDateString());
    if (this.chipMenuTrigger) {
      this.chipMenuTrigger.closeMenu();
    }
    this.search();
  }

  changeStatus(status: JobStatus, checked: boolean) {
    if (checked) {
      this.selectedStatuses.push(status);
    } else if (this.selectedStatuses.indexOf(status) > -1) {
      this.selectedStatuses.splice(this.selectedStatuses.indexOf(status), 1);
    }
    this.chips.set('statuses', this.selectedStatuses.join(','));
    this.search();
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

  getCurrentChipType(): string {
    if (this.currentChipKey && this.options.has(this.currentChipKey)) {
      return FieldDataType[this.options.get(this.currentChipKey)];
    }
    // Default to text for all labels
    return FieldDataType[FieldDataType.Text];
  }

  getDatePlaceholder(): string {
    if (this.currentChipKey == 'start') {
      return "Jobs started on or after...";
    } else if (this.currentChipKey == 'end') {
      return "Jobs ended on or before...";
    } else if (this.currentChipKey == 'submission') {
      return "Jobs submitted on or before...";
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
    if (chipKey == "statuses") {
      this.selectedStatuses = [];
    }
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
      this.route.snapshot.queryParams['q'])['statuses'];
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

/**
 * Paginator details for the jobs table. Accounts for the case where we haven't
 * loaded all jobs (matching the query) onto the client; we need to indicate
 * this rather than showing a misleading count for the number of jobs that have
 * been loaded onto the client so far.
 */
@Injectable()
export class JobsPaginatorIntl extends MatPaginatorIntl {
  private defaultIntl = new MatPaginatorIntl()

  constructor(private backendJobs: BehaviorSubject<JobListView>,
              public changes: Subject<void>) {
    super();
    backendJobs.subscribe((jobList: JobListView) => {
      // Ensure that the paginator component is redrawn once we transition to
      // an exhaustive list of jobs.
      if (jobList.exhaustive) {
        changes.next();
      }
    });
  }

  getRangeLabel = (page: number, pageSize: number, length: number) => {
    if (this.backendJobs.value.exhaustive) {
      // Can't use proper inheritance here, since MatPaginatorIntl only defines
      // properties, rather than class methods.
      return this.defaultIntl.getRangeLabel(page, pageSize, length);
    }
    // Ported from MatPaginatorIntl - boundary checks likely unneeded.
    const startIndex = page * pageSize;
    const endIndex = startIndex < length ?
        Math.min(startIndex + pageSize, length) :
        startIndex + pageSize;
    return `${startIndex + 1} - ${endIndex} of many`;
  }
}
