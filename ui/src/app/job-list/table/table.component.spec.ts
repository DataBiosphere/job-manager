import {async, ComponentFixture, TestBed, fakeAsync, tick} from '@angular/core/testing';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';
import {Observable} from 'rxjs/Observable';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {By} from '@angular/platform-browser';
import {CommonModule} from '@angular/common';
import {Component, DebugElement, ViewChild} from '@angular/core';
import {
  MatButtonModule,
  MatCardModule,
  MatMenuModule,
  MatSortModule,
  MatTableModule,
  MatTabsModule,
  MatPaginatorModule,
  MatSnackBarModule,
  MatTooltipModule,
  MatInputModule,
  MatCheckboxModule
} from '@angular/material';
import {DataSource} from '@angular/cdk/collections';
import {RouterTestingModule} from '@angular/router/testing';
import {ClrIconModule, ClrTooltipModule} from '@clr/angular';

import {ShortDateTimePipe} from '../../shared/pipes/short-date-time.pipe'
import {CapabilitiesService} from '../../core/capabilities.service';
import {JobManagerService} from '../../core/job-manager.service';
import {JobsTableComponent} from './table.component';
import {CapabilitiesResponse} from '../../shared/model/CapabilitiesResponse';
import {JobStatus} from '../../shared/model/JobStatus';
import {FakeJobManagerService} from '../../testing/fake-job-manager.service';
import {FakeCapabilitiesService} from '../../testing/fake-capabilities.service';
import {QueryJobsResult} from '../../shared/model/QueryJobsResult';
import {SharedModule} from '../../shared/shared.module';
import {JobStatusIcon} from "../../shared/common";

describe('JobsTableComponent', () => {

  let testComponent: TestTableComponent;
  let fixture: ComponentFixture<TestTableComponent>;

  let fakeJobService: FakeJobManagerService;
  let jobs: QueryJobsResult[];
  let capabilities: CapabilitiesResponse =
    {
      displayFields: [
        {field: 'status', display: 'Status'},
        {field: 'submission', display: 'Submitted'},
        {field: 'extensions.userId', display: 'User ID'},
        {field: 'labels.status-detail', display: 'Status Detail'}
      ]
    };

  function testJobs(): QueryJobsResult[] {
    return [{
      id: 'JOB1',
      name: 'TCG-NBL-7357',
      status: JobStatus.Running,
      submission: new Date('2015-04-20T20:00:00'),
      start: new Date('1994-03-29T21:00:00'),
      labels: {'status-detail': 'status-detail-1'},
      extensions: {userId: 'user-1'}
    }, {
      id: 'JOB2',
      name: 'AML-G4-CHEN',
      status: JobStatus.Submitted,
      submission: new Date('2015-04-20T20:00:00'),
      labels: {'status-detail': 'status-detail-2'},
      extensions: {userId: 'user-2'}
    }, {
      id: 'JOB3',
      name: 'TCG-NBL-B887',
      status: JobStatus.Aborted,
      submission: new Date('2015-04-20T20:00:00'),
      start: new Date('2015-04-20T21:00:00'),
      end: new Date('2015-04-20T22:00:00'),
      labels: {'status-detail': 'status-detail-3'},
      extensions: {userId: 'user-3'}
    }, {
      id: 'JOB4',
      name: 'TARGET-CCSK',
      status: JobStatus.Succeeded,
      submission: new Date('2015-04-20T20:00:00'),
      start: new Date('2015-04-20T21:00:00'),
      end: new Date('2015-04-20T22:00:00'),
      labels: {'status-detail': 'status-detail-4'},
      extensions: {userId: 'user-4'}
    }, {
      id: 'JOB5',
      name: '1543LKF678',
      status: JobStatus.Failed,
      submission: new Date('2015-04-20T20:00:00'),
      start: new Date('2015-04-20T21:00:00'),
      end: new Date('2015-04-20T22:00:00')
    }];
  }

  beforeEach(async(() => {
    jobs = testJobs();
    fakeJobService = new FakeJobManagerService(jobs)
    TestBed.configureTestingModule({
      declarations: [
        JobsTableComponent,
        TestTableComponent
      ],
      imports: [
        BrowserAnimationsModule,
        ClrIconModule,
        ClrTooltipModule,
        CommonModule,
        MatButtonModule,
        MatCardModule,
        MatCheckboxModule,
        MatInputModule,
        MatMenuModule,
        MatPaginatorModule,
        MatSnackBarModule,
        MatSortModule,
        MatTableModule,
        MatTabsModule,
        MatTooltipModule,
        RouterTestingModule.withRoutes([
          {path: '', redirectTo: 'jobs', pathMatch: 'full'},
          {path: 'jobs', component: TestTableComponent}
        ]),
        SharedModule
      ],
      providers: [
        {provide: JobManagerService, useValue: fakeJobService},
        {provide: CapabilitiesService, useValue: new FakeCapabilitiesService(capabilities)}
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TestTableComponent);
    testComponent = fixture.componentInstance;
    jobs = testJobs();
    testComponent.jobs.next(jobs);
  });

  function isGroupSelectionRendered(): boolean {
    return fixture.debugElement.queryAll(By.css('.group-abort')).length > 0;
  }

  function isGroupAbortIsEnabled(): boolean {
    const abortButton = fixture.debugElement.queryAll(By.css('.group-abort'))[0];
    return abortButton.componentInstance.disabled == false;
  }

  it('should display a row for each job', async(() => {
    fixture.detectChanges();
    let de: DebugElement = fixture.debugElement;
    expect(de.queryAll(By.css('.mat-row')).length).toEqual(jobs.length);
  }));

  it('should display general job data in row', async(() => {
    testComponent.jobs.next([jobs[0]]);
    fixture.detectChanges();
    let de: DebugElement = fixture.debugElement;
    expect(de.query(By.css('.job-details-button')).nativeElement.textContent.trim())
      .toEqual(jobs[0].name);
  }));

  it('should display extended field and label job data in row', fakeAsync(() => {
    testComponent.jobs.next([jobs[0]]);
    tick();
    fixture.detectChanges();

    let de: DebugElement = fixture.debugElement;
    expect(de.query(By.css('.job-details-button')).nativeElement.textContent.trim())
      .toEqual(jobs[0].name);


    // Another tick and detectChanges is required because of the CapabilitiesResponse
    // promise.
    tick();
    fixture.detectChanges();

    let dsubColumns = de.queryAll(By.css('.additional-column'));
    expect(dsubColumns.length).toEqual(4);
    // Unwrap image tag to verify the reflect message
    expect((dsubColumns[0].children[0].childNodes[2]['attributes']['shape']))
      .toEqual(JobStatusIcon[jobs[0].status]);
    expect(dsubColumns[1].nativeElement.textContent.trim())
      .toEqual((new ShortDateTimePipe("en-US")).transform(jobs[0].submission));
    expect(dsubColumns[2].nativeElement.textContent.trim())
      .toEqual(jobs[0].extensions.userId);
    expect(dsubColumns[3].nativeElement.textContent.trim())
      .toEqual(jobs[0].labels['status-detail']);
  }));

  it('hides the group selection on 0 selection', async(() => {
    fixture.detectChanges();
    expect(isGroupSelectionRendered()).toBeFalsy();
  }))

  it('disables the abort button for non-abortable selection', async(() => {
    fixture.detectChanges();
    for (let j of jobs) {
      j.status = JobStatus.Succeeded;
    }
    testComponent.jobs.next(jobs);
    testComponent.jobsTableComponent.toggleSelectAll();
    fixture.detectChanges();
    expect(isGroupSelectionRendered()).toBeTruthy();
    expect(isGroupAbortIsEnabled()).toBeFalsy();
  }))

  it('enables the abort button when some selected are abortable', async(() => {
    fixture.detectChanges();
    jobs[2].status = JobStatus.Running;
    testComponent.jobs.next(jobs);
    testComponent.jobsTableComponent.toggleSelectAll();
    fixture.detectChanges();
    expect(isGroupSelectionRendered()).toBeTruthy();
    expect(isGroupAbortIsEnabled()).toBeTruthy();
  }))

  it('enables the abort button when all selected are abortable', async(() => {
    fixture.detectChanges();
    for (let j of jobs) {
      j.status = JobStatus.Running;
    }
    testComponent.jobs.next(jobs);
    testComponent.jobsTableComponent.toggleSelectAll();
    fixture.detectChanges();
    expect(isGroupSelectionRendered()).toBeTruthy();
    expect(isGroupAbortIsEnabled()).toBeTruthy();
  }))

  it('displays error message bar', async(() => {
    let error = {
      status: 412,
      title: 'Precondition Failed',
      message: 'Job already in terminal status `FAILED`'
    }
    testComponent.jobsTableComponent.handleError(error);
    fixture.detectChanges();
    let de: DebugElement = fixture.debugElement;
    expect(de.query(By.css('.mat-simple-snackbar')).nativeElement.textContent)
      .toEqual("Precondition Failed (412): Job already in terminal status `FAILED` Dismiss");
  }))

  it('shows error on failed abort', async(() => {
    let count = 0;
    fakeJobService.abortJob = () => {
      // Fail every odd request.
      if (count++ % 2 === 0) {
        return Promise.reject({});
      }
      return Promise.resolve();
    };

    fixture.detectChanges();
    for (let j of jobs) {
      j.status = JobStatus.Running;
    }
    testComponent.jobs.next(jobs);
    testComponent.jobsTableComponent.toggleSelectAll();
    fixture.detectChanges();

    let de: DebugElement = fixture.debugElement;
    de.query(By.css('.group-abort')).nativeElement.click();
    fixture.detectChanges();

    fixture.whenStable().then(() => {
      expect(count).toEqual(5);
      fixture.detectChanges();

      // Unfortunately the the snackbar is not a child of the debugElement at
      // this point (before or after whenStable()), so we check the document.
      const snackTexts = [];
      document.querySelectorAll('.mat-simple-snackbar').forEach((e) => {
        snackTexts.push(e.textContent);
      });
      expect(snackTexts.find(
        s => s.includes('Failed to abort 3 of 5 requested jobs'))).toBeTruthy();
    });
  }))

  @Component({
    selector: 'jm-test-table-component',
    template:
      `<jm-job-list-table [dataSource]="dataSource"></jm-job-list-table>`
  })
  class TestTableComponent {
    public jobs = new BehaviorSubject<QueryJobsResult[]>([]);
    public dataSource = new TestDataSource(this.jobs);
    @ViewChild(JobsTableComponent)
    public jobsTableComponent: JobsTableComponent;
  }

  class TestDataSource extends DataSource<QueryJobsResult> {
    constructor(private jobs: BehaviorSubject<QueryJobsResult[]>) { super(); }

    connect(): Observable<QueryJobsResult[]> { return this.jobs; }
    disconnect() {}
  }
});
