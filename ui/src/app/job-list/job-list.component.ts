import { DataSource } from '@angular/cdk/collections';
import { Component, Input, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import { PageEvent } from "@angular/material/paginator";
import { MatSnackBar } from "@angular/material/snack-bar";
import { ActivatedRoute, NavigationError, Router } from '@angular/router';
import { BehaviorSubject, map, merge, Observable, Subject, Subscription } from 'rxjs';
import { CapabilitiesService } from '../core/capabilities.service';
import { JobManagerService } from '../core/job-manager.service';
import { SettingsService } from '../core/settings.service';
import { initialBackendPageSize } from "../shared/common";
import { FilterHeaderComponent } from '../shared/filter-header/filter-header.component';
import { JobListView, JobStream } from '../shared/job-stream';
import { CapabilitiesResponse } from '../shared/model/CapabilitiesResponse';
import { DisplayField } from "../shared/model/DisplayField";
import { QueryJobsResult } from '../shared/model/QueryJobsResult';
import { ErrorMessageFormatterPipe } from '../shared/pipes/error-message-formatter.pipe';
import { URLSearchParamsUtils } from "../shared/utils/url-search-params.utils";
import { JobsTableComponent } from "./table/table.component";


@Component({
  selector: 'jm-job-list',
  templateUrl: './job-list.component.html',
  styleUrls: ['./job-list.component.css'],
})
export class JobListComponent implements OnInit {
  @Input() pageSize: number = 50;

  @ViewChild(FilterHeaderComponent) header: FilterHeaderComponent;
  @ViewChild(JobsTableComponent) jobTable: JobsTableComponent;
  dataSource: DataSource<QueryJobsResult>;
  pageSubject: Subject<PageEvent> = new Subject<PageEvent>();

  // This Subject is synchronized to a JobStream, which we destroy and recreate
  // whenever we change query parameters, via a subscription.
  jobs = new BehaviorSubject<JobListView>({
    results: [],
    totalSize: 0,
    exhaustive: false,
    stale: false
  });
  loading = false;
  jobStream: JobStream;
  displayFields: DisplayField[] = [];
  private streamSubscription: Subscription;
  private readonly capabilities: CapabilitiesResponse;
  projectId: string;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly jobManagerService: JobManagerService,
    private readonly viewContainer: ViewContainerRef,
    private snackBar: MatSnackBar,
    readonly settingsService: SettingsService,
    private readonly capabilitiesService: CapabilitiesService) {
    this.capabilities = capabilitiesService.getCapabilitiesSynchronous();
    route.queryParams.subscribe(params => this.reloadJobs(params['q']));
  }

  ngOnInit(): void {
    this.jobStream = this.route.snapshot.data['stream'];
    this.streamSubscription = this.jobStream.subscribe(this.jobs);
    this.jobs.subscribe(jobs => {
      if (jobs.stale) {
        this.reloadJobs(this.route.snapshot.queryParams['q'], true);
      }
    });
    const req = URLSearchParamsUtils.unpackURLSearchParams(this.route.snapshot.queryParams['q']);
    this.projectId = req.extensions.projectId || '';
    this.pageSubject.subscribe(resp => this.onClientPaginate(resp));
    if (this.settingsService.getSavedSettingValue('pageSize', this.projectId)) {
      this.pageSize = this.settingsService.getSavedSettingValue('pageSize', this.projectId);
    }
    this.dataSource = new JobsDataSource(this.jobs, this.pageSubject, {
      pageSize: this.pageSize,
      pageIndex: 0,
      length: 0,
    });

    // Handle navigation errors raised in JobDetailsResolver
    this.router.events.subscribe(event => {
      if (event instanceof NavigationError) {
        this.handleError(event.error);
      }
    });

    // set project ID (if any) and get display field info for list columns
    const savedColumnSettings = this.settingsService.getSavedSettingValue('displayColumns', this.projectId);

    // assign this.displayFields to a copy of this.capabilities.displayFields and then
    // update with saved settings, if any
    this.displayFields = this.capabilities.displayFields.map((df) => Object.assign({}, df));

    this.displayFields.forEach((df) => {
      df.primary = (savedColumnSettings == null) || savedColumnSettings.includes(df.field);
    });
  }

  reloadJobs(query: string, lazy = false, updatedJobs = undefined): void {
    if (!this.streamSubscription) {
      // ngOnInit hasn't happened yet, this shouldn't occur.
      return;
    }

    this.setLoading(true, lazy);

    let req = URLSearchParamsUtils.unpackURLSearchParams(query);
    if (!req.extensions.projectId &&
        this.capabilities.queryExtensions &&
        this.capabilities.queryExtensions.includes('projectId')) {
      // If the user manages to clear the projectId chip and the UI requires a
      // project, send them back to the project selection page.
      this.router.navigate(['projects']);
      return;
    }
    if (this.header.hideArchivedToggle != null && this.settingsService.getSavedSettingValue('hideArchived', this.projectId)) {
      req.extensions.hideArchived = true;
    }

    this.streamSubscription.unsubscribe();
    const nextStream = new JobStream(this.jobManagerService, req);
    nextStream.loadAtLeast(initialBackendPageSize, updatedJobs)
      .then(() => {
        if (query !== this.route.snapshot.queryParams['q']) {
          // We initiated another query since the original request; ignore
          // the results of this old load.
          // TODO(calbach): Track/cancel any ongoing requests.
          return;
        }
        // Only subscribe after the initial page load finishes, to avoid
        // briefly loading an empty list of jobs.
        this.jobStream = nextStream;
        this.header.resetPagination();
        this.streamSubscription = this.jobStream.subscribe(this.jobs);
        this.setLoading(false, lazy);
      })
      .catch(error => this.handleError(error));
  }

  get tableOpacity() {
    if (this.loading) {
      return .4;
    }
    return 1.0;
  }

  handleError(error: any) {
    this.setLoading(false, false);

    this.snackBar.open(
      new ErrorMessageFormatterPipe().transform(error),
      'Dismiss',
      {viewContainerRef: this.viewContainer});
  }

  handleJobsChanged(updatedJobs) {
    this.reloadJobs(this.route.snapshot.queryParams['q'], false, updatedJobs);
  }

  handleFiltersChanged(filter: string[]) {
    const [key, value] = filter;
    if (this.header.chips.has(key)) {
      this.header.updateValue(key, value);
      return;
    }
    else {
      this.header.addChip(key + ':' + value);
    }
  }

  handleDisplayFieldsChanged(displayFields: DisplayField[]) {
    let fields: string[] = [];
    displayFields.forEach((field) => {
      if (field.primary) {
        fields.push(field.field);
      }
    });
    if (this.header.hideArchivedToggle && (this.settingsService.getSavedSettingValue('hideArchived', this.projectId) != this.header.hideArchivedToggle.checked)) {
      this.settingsService.setSavedSettingValue('hideArchived', this.header.hideArchivedToggle.checked, this.projectId);
      this.jobTable.displayedColumns = fields;
      this.reloadJobs(this.route.snapshot.queryParams['q'], true);
    }
    this.settingsService.setSavedSettingValue('displayColumns', fields, this.projectId);
    this.jobTable.displayedColumns = fields;
    this.jobTable.setUpFieldsAndColumns();
  }

  private setLoading(loading: boolean, lazy: boolean): void {
    if (!lazy) {
      this.loading = loading;
    } else {
      if (loading) {
        this.snackBar.open('Loading...');
      } else {
        this.snackBar.dismiss();
      }
    }
  }

  private onClientPaginate(e: PageEvent) {
    if (e.pageSize != this.pageSize) {
      this.settingsService.setSavedSettingValue('pageSize', e.pageSize, this.projectId);
      this.pageSize = e.pageSize;
    }
    // If the client just navigated to page n, ensure we have enough jobs to
    // display page n+1.
    this.jobStream.loadAtLeast((e.pageIndex+2) * e.pageSize)
      .catch((error) => this.handleError(error));
  }
}


/** DataSource providing the list of jobs to be rendered in the table. */
export class JobsDataSource extends DataSource<QueryJobsResult> {

  constructor(
    private backendJobs: BehaviorSubject<JobListView>,
    private pageSubject: Subject<PageEvent>,
    private lastPageEvent: PageEvent) {
    super();
  }

  connect(): Observable<QueryJobsResult[]> {
    const p = this.pageSubject.pipe(map((e) => this.lastPageEvent = e));
    return merge(this.backendJobs, p).pipe(map(() => {
      const data = this.backendJobs.value.results.slice();

      // Get only the requested page
      const startIndex = this.lastPageEvent.pageIndex * this.lastPageEvent.pageSize;
      return data.splice(startIndex, this.lastPageEvent.pageSize);
    }));
  }

  disconnect() {}
}
