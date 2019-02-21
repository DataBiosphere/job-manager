import {BehaviorSubject} from 'rxjs/BehaviorSubject';
import {Subject} from 'rxjs/Subject';
import {
  AfterViewChecked,
  AfterViewInit,
  ChangeDetectorRef,
  Component, EventEmitter,
  Injectable,
  Input,
  NgZone,
  OnDestroy,
  OnInit, Output, QueryList,
  ViewChild,
  ViewChildren
} from '@angular/core';
import {ENTER} from '@angular/cdk/keycodes';
import {FormControl} from '@angular/forms';
import {ActivatedRoute, Router} from '@angular/router';
import {Observable} from 'rxjs/Observable';
import {Subscription} from 'rxjs/Subscription';
import {TitleCasePipe} from '@angular/common';
import {
  MatAutocompleteTrigger,
  MatPaginator,
  MatPaginatorIntl,
  PageEvent,
} from '@angular/material';

import {AuthService} from '../../core/auth.service';
import {CapabilitiesService} from '../../core/capabilities.service';
import {URLSearchParamsUtils} from '../utils/url-search-params.utils';
import {JobStatus} from '../model/JobStatus';
import {FieldDataType, JobStatusIcon} from '../common';
import {JobListView} from '../job-stream';
import {FilterChipComponent} from "./chips/filter-chip.component";
import {CapabilitiesResponse} from "../model/CapabilitiesResponse";
import {DisplayField} from "../model/DisplayField";
import {SettingsService} from "../../core/settings.service";

@Component({
  selector: 'jm-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
})
export class HeaderComponent implements OnInit, AfterViewInit, AfterViewChecked, OnDestroy {
  @Input() jobs: BehaviorSubject<JobListView>;
  @Input() pageSize: number;
  @Input() showControls: boolean = true;
  @Output() onDisplayFieldsChanged: EventEmitter<DisplayField[]> = new EventEmitter();
  @ViewChildren(FilterChipComponent) chipElements: QueryList<FilterChipComponent>;
  @ViewChild('hideArchivedToggle') hideArchivedToggle: HTMLInputElement;
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
  displayFields: DisplayField[] = [];

  readonly buttonStatuses = ['Running', 'Succeeded', 'Failed', 'Aborted', 'OnHold'];
  private readonly capabilities: CapabilitiesResponse;
  projectId: string;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly capabilitiesService: CapabilitiesService,
    private readonly authService: AuthService,
    private readonly settingsService: SettingsService,
    private zone: NgZone,
    private cdr: ChangeDetectorRef,
  ) {
    route.queryParams.subscribe(params => this.refreshChips(params['q']));
    this.capabilities = this.capabilitiesService.getCapabilitiesSynchronous();
  }

  ngOnInit(): void {
    if (this.route.snapshot.queryParams['q']) {
      this.chips = URLSearchParamsUtils.getChips(this.route.snapshot.queryParams['q']);
    }

    this.options = URLSearchParamsUtils.getQueryFields(this.capabilities);
    this.filterOptions();
  }

  ngAfterViewInit(): void {
    // The @ViewChild property may not be initialized until after view init.
    if (this.paginator) {
      this.pageSubscription = this.paginator.page.subscribe(this.pageSubject);
      // Template-bound properties should not be modified during this lifecycle
      // hook, so we set a timeout to make that change asynchronous.
      // https://angular.io/guide/lifecycle-hooks#abide-by-the-unidirectional-data-flow-rule
      setTimeout(() => {
        // Our paginator details depend on the state of backend pagination,
        // therefore we cannot simply inject an alternate MatPaginatorIntl, as
        // recommended by the paginator documentation. _intl is public, and
        // overwriting it seems preferable to providing our own version of
        // MatPaginator.
        this.paginator._intl = new JobsPaginatorIntl(
          this.jobs, this.paginator._intl.changes);
        this.paginator._intl.changes.next();
      }, 0);
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

  getDisplayForFilter(value: string): string {
    const displayField = this.capabilities.displayFields.find((f) => f.field == value);
    if (displayField && displayField.display) {
      return displayField.display;
    }
    const labelField = this.capabilities.displayFields.find((f) => f.field == 'labels.' + value);
    if (labelField && labelField.display) {
      return labelField.display;
    }
    const titleCasePipe: TitleCasePipe = new TitleCasePipe();
    return titleCasePipe.transform(value);
  }

  navigateWithStatus(statuses: JobStatus[]): void {
    this.chips.set('status', statuses.map((status) => JobStatus[status]).join(','));
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

  hasChipsToClear(): boolean {
    return this.getChipKeys().filter(key => key != 'projectId').length > 0;
  }

  removeAllChips(): void {
    this.chips.forEach((value: string, key: string) => {
      if (key != 'projectId') {
        this.chips.delete(key);
      }
    });
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
      this.route.snapshot.queryParams['q'])['status'];
  }

  shouldDisplayStatusCounts(): boolean {
    // Only show status counts if all jobs are loaded client-side.
    return this.jobs.value.exhaustive;
  }

  showJobsWithStatus(status: string): void {
    this.navigateWithStatus([JobStatus[status]]);
  }

  getJobsCountForStatus(status: string): number {
    return this.jobs.value.results.filter(
      j => j.status == JobStatus[status]).length;
  }

  getStatusIcon(status: JobStatus): string {
    return JobStatusIcon[status];
  }

  toggleDisplayColumn(field: DisplayField) {
    const newValue = !field.primary;
    this.displayFields.forEach((df) => {
      if (df.field == field.field) {
        df.primary = newValue;
      }
    })
  }

  getSavedSetting(settingName: string) {
    return this.settingsService.getSavedSettingValue(settingName, this.projectId);
  }

  saveSettings() {
    this.onDisplayFieldsChanged.emit(this.displayFields);
  }

  isSignedIn(): boolean {
    return !!this.authService.userId;
  }

  signOut(): void {
    this.authService.signOut().then(() => {
      this.router.navigate(
        ['/sign_in']
      );
    });
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
  private defaultIntl = new MatPaginatorIntl();

  constructor(private backendJobs: BehaviorSubject<JobListView>,
              public changes: Subject<void>) {
    super();
    backendJobs.subscribe((jobList: JobListView) => {
        changes.next();
    });
  }

  getRangeLabel = (page: number, pageSize: number, length: number) => {

    let knownLength = null;
    if (this.backendJobs.value.totalSize ||
        this.backendJobs.value.totalSize === 0) {
      knownLength = this.backendJobs.value.totalSize;
    } else if (this.backendJobs.value.exhaustive) {
      knownLength = length;
    }

    if (knownLength !== null) {
      // Can't use proper inheritance here, since MatPaginatorIntl only defines
      // properties, rather than class methods.
      return this.defaultIntl.getRangeLabel(page, pageSize, knownLength);
    } else {
      // Ported from MatPaginatorIntl - boundary checks likely unneeded.
      const startIndex = page * pageSize;
      const endIndex = startIndex < length ?
          Math.min(startIndex + pageSize, length) :
          startIndex + pageSize;
      return `${startIndex + 1} - ${endIndex} of many`;
    }
  }
}
