import {
  Component, ElementRef, EventEmitter, Input, OnChanges, OnInit,
  Output, SimpleChanges, ViewChild
} from '@angular/core';

import {DataSource} from '@angular/cdk/collections';
import {JobMonitorService} from '../../job-monitor.service';
import {JobQueryResult} from '../../model/JobQueryResult';
import {JobQueryRequest} from '../../model/JobQueryRequest';
import StatusesEnum = JobQueryRequest.StatusesEnum;
import {JobMetadataResponse} from '../../model/JobMetadataResponse';
import {MdPaginator} from '@angular/material';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';
import {Observable} from 'rxjs/Observable';
import 'rxjs/add/operator/startWith';
import 'rxjs/add/observable/merge';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/debounceTime';
import 'rxjs/add/operator/distinctUntilChanged';
import 'rxjs/add/observable/fromEvent';

@Component({
  selector: 'list-jobs',
  templateUrl: './list-jobs.component.html',
  styleUrls: ['./list-jobs.component.css'],
})
export class ListJobsComponent implements OnChanges, OnInit {
  @Input() jobs: JobQueryResult[] = [];
  @Output() updateJobs: EventEmitter<boolean> = new EventEmitter();
  private selectedJobs: JobQueryResult[] = [];
  private isActive: boolean = true;
  private expandedJob: JobQueryResult;
  private expandedJobMetadata: JobMetadataResponse;
  private mouseoverJobs: JobQueryResult[] = [];
  private allSelected: boolean = false;

  // New stuff
  database = new JobsDatabase(this.jobs);
  dataSource: JobsDataSource | null;
  displayedColumns = ['jobName', 'owner', 'status', 'label1', 'label2', 'label3'];

  @ViewChild(MdPaginator) paginator: MdPaginator;
  @ViewChild('filter') filter: ElementRef;

  constructor(
    private jobMonitorService: JobMonitorService
  ) {}

  // New stuff
  ngOnInit() {
    this.dataSource = new JobsDataSource(this.database, this.paginator);
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

  abortJob(job: JobQueryResult): void {
    this.jobMonitorService.abortJob(job.id)
      .then(response => job.status = response.status);
  }

  toggleSelect(job: JobQueryResult): void {
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

  toggleActive(): void {
    this.isActive = !this.isActive;
    this.onJobsChanged();
  }

  toggleMouseOver(job: JobQueryResult): void {
    let i: number = this.mouseoverJobs.indexOf(job);
    if (i > -1) {
      this.mouseoverJobs.splice(i, 1);
    } else {
      this.mouseoverJobs.push(job);
    }
  }

  isMouseOver(job: JobQueryResult): boolean {
    if (this.mouseoverJobs.indexOf(job) > -1 || this.expandedJob == job) {
      return true;
    }
    return false;
  }

  setExpandedJob(job: JobQueryResult): void {
    if (job === this.expandedJob) {
      this.expandedJob = null;
      this.expandedJobMetadata = null;
    } else {
      this.expandedJob = job;
      this.jobMonitorService.getJob(job.id)
        .then(response => this.expandedJobMetadata = response);
    }
  }

  areRunning(jobs: JobQueryResult[]): boolean {
    for (let job of jobs) {
      if (job.status != StatusesEnum[StatusesEnum.Running]) {
        return false;
      }
    }
    return true;
  }

  showMetadata(job: JobQueryResult): void {}

  getDropdownArrowUrl(job: JobQueryResult): string {
    if (job === this.expandedJob) {
      return "https://www.gstatic.com/images/icons/material/system/1x/keyboard_arrow_up_grey600_24dp.png"
    }
    return "https://www.gstatic.com/images/icons/material/system/1x/keyboard_arrow_down_grey600_24dp.png"
  }

  getStatusUrl(status: StatusesEnum): string {
    switch(status) {
      case StatusesEnum.Submitted:
        return "https://www.gstatic.com/images/icons/material/system/1x/file_upload_grey600_24dp.png";
      case StatusesEnum.Running:
        return "https://www.gstatic.com/images/icons/material/system/1x/autorenew_grey600_24dp.png";
      case StatusesEnum.Aborting:
        return "https://www.gstatic.com/images/icons/material/system/1x/report_problem_grey600_24dp.png";
      case StatusesEnum.Failed:
        return "https://www.gstatic.com/images/icons/material/system/1x/close_grey600_24dp.png";
      case StatusesEnum.Aborted:
        return "https://www.gstatic.com/images/icons/material/system/1x/report_problem_grey600_24dp.png";
      case StatusesEnum.Succeeded:
        return "https://www.gstatic.com/images/icons/material/system/1x/done_grey600_24dp.png";
    }
  }

  getLocaleString(date: Date): string {
    if (date != null) {
      return date.toLocaleString();
    }
    return null;
  }

  getLocaleTimeString(date: Date): string {
    if (date != null) {
      return date.toLocaleTimeString();
    }
    return null;
  }

  onPauseJob(job: JobQueryResult): void {
    this.onPauseJobs([job]);
  }

  onPauseJobs(jobs: JobQueryResult[]): void {
    // TODO (Implement)
    this.onJobsChanged();
  }

  onAbortJobs(jobs: JobQueryResult[]): void {
    for (let job of jobs) {
      this.abortJob(job);
    }
    this.onJobsChanged();
  }

  onGroupJobs(jobs: JobQueryResult[]): void {
    // TODO (Implement)
    this.onJobsChanged();
  }

  isSelected(job: JobQueryResult): boolean {
    return this.selectedJobs.indexOf(job) > -1;
  }

  private onJobsChanged(): void {
    this.updateJobs.emit(this.isActive);
    this.allSelected = false;
    this.selectedJobs = [];
    this.expandedJob = null;
    this.paginator.pageIndex = 0;
  }
}

// New stuff

/** Simple database an observable list of jobs to be subscribed to by the
 *  DataSource. */
export class JobsDatabase {
  private jobs: JobQueryResult[];
  /** Stream that emits whenever the data has been modified. */
  dataChange: BehaviorSubject<JobQueryResult[]> = new BehaviorSubject<JobQueryResult[]>(this.jobs);
  get data(): JobQueryResult[] { return this.dataChange.value; }

  constructor(jobs: JobQueryResult[]) {
    this.jobs = jobs;
    this.dataChange.next(this.jobs);
  }
}

/** DataSource providing the list of jobs to be rendered in the table. */
export class JobsDataSource extends DataSource<any> {
  visibleJobs: JobQueryResult[];
  _filterChange = new BehaviorSubject('');
  get filter(): string { return this._filterChange.value; }
  set filter(filter: string) { this._filterChange.next(filter); }

  constructor(private _db: JobsDatabase, private _paginator: MdPaginator) {
    super();
  }

  connect(): Observable<JobQueryResult[]> {
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
        .filter((job: JobQueryResult) => {
          let searchStr = (job.name + job.status).toLowerCase();
          return searchStr.indexOf(this.filter.toLowerCase()) != -1;
        })
        .splice(startIndex, this._paginator.pageSize);
      return this.visibleJobs.slice();
    });
  }

  disconnect() {}
}
