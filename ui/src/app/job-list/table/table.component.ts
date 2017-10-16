import {BehaviorSubject} from 'rxjs/BehaviorSubject';
import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import {DataSource} from '@angular/cdk/collections';
import {MdPaginator, MdTabChangeEvent} from '@angular/material';
import {Observable} from 'rxjs/Observable';
import 'rxjs/add/operator/startWith';
import 'rxjs/add/observable/merge';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/debounceTime';
import 'rxjs/add/operator/distinctUntilChanged';
import 'rxjs/add/observable/fromEvent';

import {JobMonitorService} from '../../core/job-monitor.service';
import {JobStatus} from '../../shared/model/JobStatus';
import {QueryJobsResult} from '../../shared/model/QueryJobsResult';
import {JobStatusImage, StatusGroup} from '../../shared/common';
import {ActivatedRoute, Router} from '@angular/router';

@Component({
  selector: 'jm-job-list-table',
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.css'],
})
export class JobsTableComponent implements OnChanges, OnInit {
  @Input() jobs: QueryJobsResult[] = [];
  @Output() updateJobs: EventEmitter<StatusGroup> = new EventEmitter();
  private expandedJob: QueryJobsResult;
  private selectedJobs: QueryJobsResult[] = [];
  private mouseoverJob: QueryJobsResult;
  private allSelected: boolean = false;
  private currentStatusGroup: StatusGroup;
  private statusGroup = StatusGroup;
  private statusGroupStringMap: Map<StatusGroup, string> = new Map([
    [StatusGroup.Active, "Active Jobs"],
    [StatusGroup.Failed, "Failed"],
    [StatusGroup.Completed, "Completed"]
  ]);
  private reverseStatusGroupStringMap: Map<string, StatusGroup> = new Map([
    ["Active Jobs", StatusGroup.Active],
    ["Failed", StatusGroup.Failed],
    ["Completed", StatusGroup.Completed]
  ]);

  database = new JobsDatabase(this.jobs);
  dataSource: JobsDataSource | null;
  // TODO(alanhwang): Allow these columns to be configured by the user
  displayedColumns = [
    'jobName',
    'owner',
    'status',
    'status-detail',
    'submitted',
  ];

  @ViewChild(MdPaginator) paginator: MdPaginator;
  @ViewChild('filter') filter: ElementRef;

  constructor(
    private route: ActivatedRoute,
    private jobMonitorService: JobMonitorService
  ) {}

  ngOnInit() {
    this.dataSource = new JobsDataSource(this.database, this.paginator);
    this.currentStatusGroup = this.route.snapshot.queryParams['statusGroup'];
    Observable.fromEvent(this.filter.nativeElement, 'keyup')
      .debounceTime(150)
      .distinctUntilChanged()
      .subscribe(() => {
        if (!this.dataSource) { return; }
        this.dataSource.filter = this.filter.nativeElement.value;
      });
  }

  ngOnChanges(changes: SimpleChanges) {
    this.jobs = changes.jobs.currentValue;
    this.database.dataChange.next(this.jobs);
  }

  private onJobsChanged(): void {
    this.updateJobs.emit(this.currentStatusGroup);
    this.allSelected = false;
    this.selectedJobs = [];
    this.paginator.pageIndex = 0;
  }

  abortJob(job: QueryJobsResult): void {
    this.jobMonitorService.abortJob(job.id)
      .then(() => job.status = JobStatus.Aborted);
  }

  canAbort(job: QueryJobsResult): boolean {
    return job.status == JobStatus.Submitted || job.status == JobStatus.Running;
  }

  getDropdownArrowUrl(): string {
    return "https://www.gstatic.com/images/icons/material/system/1x/arrow_drop_down_grey700_24dp.png"
  }

  getStatusUrl(status: JobStatus): string {
    return JobStatusImage[status];
  }

  getTabSelectedIndex(): number {
    switch(this.currentStatusGroup) {
      case StatusGroup.Active: {
        return 0;
      }
      case StatusGroup.Failed: {
        return 1;
      }

      case StatusGroup.Completed: {
        return 2;
      }
    }
  }

  isSelected(job: QueryJobsResult): boolean {
    return this.selectedJobs.indexOf(job) > -1;
  }

  onAbortJobs(jobs: QueryJobsResult[]): void {
    for (let job of jobs) {
      this.abortJob(job);
    }
    this.onJobsChanged();
  }

  showDropdownArrow(job: QueryJobsResult): boolean {
    return job == this.mouseoverJob || job == this.expandedJob;
  }


  toggleActive(event: MdTabChangeEvent): void {
    this.currentStatusGroup = this.reverseStatusGroupStringMap.get(event.tab.textLabel);
    this.onJobsChanged();
  }

  toggleMouseOver(job: QueryJobsResult): void {
    if (this.mouseoverJob == job) {
      this.mouseoverJob = null;
    } else {
      this.mouseoverJob = job;
    }
  }

  toggleSelect(job: QueryJobsResult): void {
    if (this.isSelected(job)) {
      this.selectedJobs
        .splice(this.selectedJobs.indexOf(job), 1);
      this.allSelected = false;
    } else {
      this.selectedJobs.push(job);
    }
  }

  toggleSelectAll(): void {
    if (this.allSelected) {
      this.selectedJobs = [];
      this.allSelected = false;
    } else {
      this.selectedJobs = this.jobs.slice();
      this.allSelected = true;
    }
  }
}

/** Simple database with an observable list of jobs to be subscribed to by the
 *  DataSource. */
export class JobsDatabase {
  private jobs: QueryJobsResult[];
  /** Stream that emits whenever the data has been modified. */
  dataChange: BehaviorSubject<QueryJobsResult[]> =
    new BehaviorSubject<QueryJobsResult[]>(this.jobs);
  get data(): QueryJobsResult[] { return this.dataChange.value; }

  constructor(jobs: QueryJobsResult[]) {
    this.jobs = jobs;
    this.dataChange.next(this.jobs);
  }
}

/** DataSource providing the list of jobs to be rendered in the table. */
export class JobsDataSource extends DataSource<any> {
  visibleJobs: QueryJobsResult[];
  _filterChange = new BehaviorSubject('');
  get filter(): string { return this._filterChange.value; }
  set filter(filter: string) { this._filterChange.next(filter); }

  constructor(private _db: JobsDatabase, private _paginator: MdPaginator) {
    super();
  }

  connect(): Observable<QueryJobsResult[]> {
    const displayDataChanges = [
      this._db.dataChange,
      this._paginator.page,
      this._filterChange,
    ];

    return Observable.merge(...displayDataChanges).map(() => {
      const data = this._db.data.slice();

      // Get only the requested page
      const startIndex = this._paginator.pageIndex * this._paginator.pageSize;
      this.visibleJobs = data
        .filter((job: QueryJobsResult) => {
          let searchStr = (job.name + job.status).toLowerCase();
          return searchStr.indexOf(this.filter.toLowerCase()) != -1;
        })
        .splice(startIndex, this._paginator.pageSize);
      return this.visibleJobs.slice();
    });
  }

  disconnect() {}
}
