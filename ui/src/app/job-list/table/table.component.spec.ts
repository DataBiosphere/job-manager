import {TestBed, async, ComponentFixture} from '@angular/core/testing';
import {By} from '@angular/platform-browser';
import {Component, DebugElement, ViewChild} from '@angular/core';
import {
  MdButtonModule,
  MdCardModule,
  MdMenuModule,
  MdSortModule,
  MdTableModule,
  MdTabsModule,
  MdPaginatorModule,
  MdTooltipModule,
  MdInputModule,
  MdCheckboxModule
} from '@angular/material';

import {SharedModule} from '../../shared/shared.module';
import {JobStatus} from '../../shared/model/JobStatus';
import {JobsTableComponent} from './table.component';
import {QueryJobsResult} from '../../shared/model/QueryJobsResult';
import {CommonModule} from '@angular/common';
import {RouterTestingModule} from '@angular/router/testing';
import {JobMonitorService} from '../../core/job-monitor.service';
import {JobListView} from "../../shared/job-stream";
import {BehaviorSubject} from 'rxjs/BehaviorSubject';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {newDefaultMockJobMonitorService} from '../../shared/mock-job-monitor.service';

describe('JobsTableComponent', () => {

  let testComponent: TestTableComponent;
  let fixture: ComponentFixture<TestTableComponent>;
  let testJob1: QueryJobsResult = {
    id: 'JOB1',
    name: 'TCG-NBL-7357',
    status: JobStatus.Running,
    submission: new Date('2015-04-20T20:00:00'),
    start: new Date('1994-03-29T21:00:00'),
    labels: {'user-id': 'user-1', 'status-detail': 'status-detail-1'}};
  let testJobs: QueryJobsResult[] =
    [
      testJob1,
      { id: 'JOB2',
        name: 'AML-G4-CHEN',
        status: JobStatus.Submitted,
        submission: new Date('2015-04-20T20:00:00'),
        labels: {'user-id': 'user-2', 'status-detail': 'status-detail-2'}},
      { id: 'JOB3',
        name: 'TCG-NBL-B887',
        status: JobStatus.Aborted,
        submission: new Date('2015-04-20T20:00:00'),
        start: new Date('2015-04-20T21:00:00'),
        end: new Date('2015-04-20T22:00:00'),
        labels: {'user-id': 'user-3', 'status-detail': 'status-detail-3'}},
      { id: 'JOB4',
        name: 'TARGET-CCSK',
        status: JobStatus.Succeeded,
        submission: new Date('2015-04-20T20:00:00'),
        start: new Date('2015-04-20T21:00:00'),
        end: new Date('2015-04-20T22:00:00'),
        labels: {'user-id': 'user-4', 'status-detail': 'status-detail-4'}},
      { id: 'JOB5',
        name: '1543LKF678',
        status: JobStatus.Failed,
        submission: new Date('2015-04-20T20:00:00'),
        start: new Date('2015-04-20T21:00:00'),
        end: new Date('2015-04-20T22:00:00')}
    ];

  beforeEach(async(() => {

    TestBed.configureTestingModule({
      declarations: [
        JobsTableComponent,
        TestTableComponent
      ],
      imports: [
        BrowserAnimationsModule,
        CommonModule,
        MdButtonModule,
        MdCardModule,
        MdCheckboxModule,
        MdInputModule,
        MdMenuModule,
        MdPaginatorModule,
        MdSortModule,
        MdTableModule,
        MdTabsModule,
        MdTooltipModule,
        RouterTestingModule.withRoutes([
          {path: '', redirectTo: 'jobs', pathMatch: 'full'},
          {path: 'jobs', component: TestTableComponent}
        ]),
        SharedModule
      ],
      providers: [
        {provide: JobMonitorService, userValue: newDefaultMockJobMonitorService()}
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TestTableComponent);
    testComponent = fixture.componentInstance;
  });

  it('should display a row for each job', async(() => {
    fixture.detectChanges();
    let de: DebugElement = fixture.debugElement;
    expect(de.queryAll(By.css('.md-row')).length).toEqual(testJobs.length);
  }));

  it('should display job data in row', async(() => {
    testComponent.jobs.next({
      results: [testJob1],
      exhaustive: true
    });
    fixture.detectChanges();
    let de: DebugElement = fixture.debugElement;
    expect(de.query(By.css('.job-details-button')).nativeElement.textContent)
      .toEqual(testJob1.name);
    expect(de.query(By.css('#owner-column')).nativeElement.textContent)
      .toEqual(testJob1.labels['user-id']);
    expect(de.query(By.css('#status-detail-column')).nativeElement.textContent)
      .toContain(testJob1.labels['status-detail']);
    expect(de.query(By.css('#submitted-column')).nativeElement.textContent)
      .toContain('8:00 PM');
  }));

  // TODO(alanhwang): Add unit tests for component logic

  @Component({
    selector: 'jm-test-table-component',
    template:
      `<jm-job-list-table [jobs]="jobs"></jm-job-list-table>`
  })
  class TestTableComponent {
    public jobs = new BehaviorSubject<JobListView>({
      results: testJobs,
      exhaustive: true
    });
    @ViewChild(JobsTableComponent)
    public jobsTableComponent: JobsTableComponent;
  }

});
