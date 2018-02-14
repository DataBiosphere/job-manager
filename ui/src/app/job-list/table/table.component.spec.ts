import {async, ComponentFixture, TestBed} from '@angular/core/testing';
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

import {JobListView} from "../../shared/job-stream";
import {JobManagerService} from '../../core/job-manager.service';
import {JobsTableComponent} from './table.component';
import {JobStatus} from '../../shared/model/JobStatus';
import {FakeJobManagerService} from '../../testing/fake-job-manager.service';
import {QueryJobsResult} from '../../shared/model/QueryJobsResult';
import {SharedModule} from '../../shared/shared.module';
import {environment} from '../../../environments/environment';

describe('JobsTableComponent', () => {

  let testComponent: TestTableComponent;
  let fixture: ComponentFixture<TestTableComponent>;
  let jobs: QueryJobsResult[];

  function testJobs(count: number): QueryJobsResult[] {
    return [{
      id: 'JOB1',
      name: 'TCG-NBL-7357',
      status: JobStatus.Running,
      submission: new Date('2015-04-20T20:00:00'),
      start: new Date('1994-03-29T21:00:00'),
      labels: {'user-id': 'user-1', 'status-detail': 'status-detail-1'}
    }, {
      id: 'JOB2',
      name: 'AML-G4-CHEN',
      status: JobStatus.Submitted,
      submission: new Date('2015-04-20T20:00:00'),
      labels: {'user-id': 'user-2', 'status-detail': 'status-detail-2'}
    }, {
      id: 'JOB3',
      name: 'TCG-NBL-B887',
      status: JobStatus.Aborted,
      submission: new Date('2015-04-20T20:00:00'),
      start: new Date('2015-04-20T21:00:00'),
      end: new Date('2015-04-20T22:00:00'),
      labels: {'user-id': 'user-3', 'status-detail': 'status-detail-3'}
    }, {
      id: 'JOB4',
      name: 'TARGET-CCSK',
      status: JobStatus.Succeeded,
      submission: new Date('2015-04-20T20:00:00'),
      start: new Date('2015-04-20T21:00:00'),
      end: new Date('2015-04-20T22:00:00'),
      labels: {'user-id': 'user-4', 'status-detail': 'status-detail-4'}
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
    TestBed.configureTestingModule({
      declarations: [
        JobsTableComponent,
        TestTableComponent
      ],
      imports: [
        BrowserAnimationsModule,
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
        {provide: JobManagerService, userValue: new FakeJobManagerService([])}
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TestTableComponent);
    testComponent = fixture.componentInstance;
    jobs = testJobs();
    testComponent.jobs.next(jobs);
  });

  function isGroupAbortRendered(): boolean {
    return fixture.debugElement.queryAll(By.css('.group-abort')).length > 0;
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
    expect(de.query(By.css('.job-details-button')).nativeElement.textContent)
      .toEqual(jobs[0].name);
    expect(de.query(By.css('#submitted-column')).nativeElement.textContent)
      .toContain('8:00 PM');
    expect(de.queryAll(By.css('.additional-column')).length).toEqual(0);
  }));

  it('should display dsub-specific job data in row', async(() => {
    environment.additionalColumns = ['user-id', 'status-detail'];
    testComponent.jobs.next([jobs[0]]);
    fixture.detectChanges();
    let de: DebugElement = fixture.debugElement;
    expect(de.query(By.css('.job-details-button')).nativeElement.textContent)
      .toEqual(jobs[0].name);
    let dsubColumns = de.queryAll(By.css('.additional-column'));
    expect(dsubColumns.length).toEqual(2);
    expect(dsubColumns[0].nativeElement.textContent)
      .toEqual(jobs[0].labels['user-id']);
    expect(dsubColumns[1].nativeElement.textContent)
      .toEqual(jobs[0].labels['status-detail']);
  }));

  it('hides the abort button on 0 selection', async(() => {
    fixture.detectChanges();
    expect(isGroupAbortRendered()).toBeFalse();
  }))

  it('hides the abort button for non-abortable selection', async(() => {
    for (let j of jobs) {
      j.status = JobStatus.Succeeded;
    }
    testComponent.jobs.next(jobs);
    testComponent.jobsTableComponent.toggleSelectAll();
    fixture.detectChanges();
    expect(isGroupAbortRendered()).toBeFalse();
  }))

  it('shows the abort button when some selected are abortable', async(() => {
    jobs[2].status = JobStatus.Running;
    testComponent.jobs.next(jobs);
    testComponent.jobsTableComponent.toggleSelectAll();
    fixture.detectChanges();
    expect(isGroupAbortRendered()).toBeTrue();
  }))

  it('shows the abort button when all selected are abortable', async(() => {
    for (let j of jobs) {
      j.status = JobStatus.Running;
    }
    testComponent.jobs.next(jobs);
    testComponent.jobsTableComponent.toggleSelectAll();
    fixture.detectChanges();
    expect(isGroupAbortRendered()).toBeTrue();
  }))

  it ('displays error message bar', async(() => {
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

  // TODO(alanhwang): Add unit tests for component logic

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
