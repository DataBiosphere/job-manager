import {async, ComponentFixture, TestBed, fakeAsync, tick} from '@angular/core/testing';
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
  MatPaginatorModule,
  MatSnackBarModule,
  MatTooltipModule,
  MatCheckboxModule
} from '@angular/material';
import {RouterTestingModule} from '@angular/router/testing';

import {CapabilitiesService} from '../core/capabilities.service';
import {JobListComponent} from "./job-list.component"
import {JobsTableComponent} from "./table/table.component"
import {JobManagerService} from '../core/job-manager.service';
import {JobListResolver} from './job-list-resolver.service';
import {FakeJobManagerService} from '../testing/fake-job-manager.service';
import {FakeCapabilitiesService} from '../testing/fake-capabilities.service';
import {SharedModule} from '../shared/shared.module';
import {Router} from "@angular/router";
import {Observable} from "rxjs/Observable";
import 'rxjs/add/observable/of';
import {CapabilitiesResponse} from '../shared/model/CapabilitiesResponse';
import {QueryJobsResult} from '../shared/model/QueryJobsResult';
import {JobStatus} from "../shared/model/JobStatus";

describe('JobListComponent', () => {

  // Jobs with IDs JOB0 -> JOB4.
  function testJobs(count: number): QueryJobsResult[] {
    const base = {
      status: JobStatus.Running,
      submission: new Date('2015-04-20T20:00:00'),
      extensions: {userId: 'test-user-id'}
    };
    return (new Array(count)).fill(null).map((_, i) => {
      return {
        ...base,
        id: `JOB${i}`,
        name: `JOB ${i}`
      };
    });
  }

  let testComponent: JobListComponent;
  let fixture: ComponentFixture<TestJobListComponent>;
  let fakeJobService: FakeJobManagerService;

  let capabilities: CapabilitiesResponse = 
    {
      displayFields: [
        {field: 'status', display: 'Status'},
        {field: 'submission', display: 'Submitted'},
        {field: 'extensions.userId', display: 'User ID'},
      ]
    };

  beforeEach(async(() => {
    fakeJobService = new FakeJobManagerService(testJobs(5));

    TestBed.configureTestingModule({
      declarations: [
        AppComponent,
        JobListComponent,
        TestJobListComponent,
        JobsTableComponent
      ],
      imports: [
        BrowserAnimationsModule,
        CommonModule,
        MatButtonModule,
        MatCardModule,
        MatCheckboxModule,
        MatMenuModule,
        MatPaginatorModule,
        MatSnackBarModule,
        MatSortModule,
        MatTableModule,
        MatTooltipModule,
        RouterTestingModule.withRoutes([
          {path: '', component: TestJobListComponent, resolve: {stream: JobListResolver}},
          {path: 'jobs', component: TestJobListComponent, resolve: {stream: JobListResolver}}
        ]),
        SharedModule
      ],
      providers: [
        {provide: JobManagerService, useValue: fakeJobService},
        {provide: CapabilitiesService, useValue: new FakeCapabilitiesService(capabilities)},
        JobListResolver
      ],
    }).compileComponents();
  }));

  beforeEach(fakeAsync(() => {
    fixture = TestBed.createComponent(AppComponent);

    const router: Router = TestBed.get(Router);
    router.initialNavigation();
    router.navigate(['']);
    tick();

    testComponent = fixture.debugElement.query(By.css('jm-job-list')).componentInstance;
  }));

  function expectJobsRendered(jobs: QueryJobsResult[]) {
    const de: DebugElement = fixture.debugElement;
    const rows = de.queryAll(By.css('.mat-row'))
    expect(rows.length).toEqual(jobs.length);
    rows.forEach((row, i) => {
      expect(row.nativeElement.textContent).toContain(jobs[i].name);
    });
  }

  it('displays error message bar', async(() => {
    let error = {
      status: 400,
      title: 'Bad Request',
      message: 'Missing required field `parentId`'
    };
    testComponent.handleError(error);
    fixture.detectChanges();
    let de: DebugElement = fixture.debugElement;
    expect(de.query(By.css('.mat-simple-snackbar')).nativeElement.textContent)
      .toEqual("Bad Request (400): Missing required field `parentId` Dismiss");
  }));

  it('renders job rows', fakeAsync(() => {
    tick();
    fixture.detectChanges();

    expectJobsRendered(fakeJobService.jobs.slice(0, 3));
  }));

  it('paginates forward', fakeAsync(() => {
    fakeJobService.jobs = testJobs(5);
    tick();
    fixture.detectChanges();
    const de: DebugElement = fixture.debugElement;
    de.query(By.css('.mat-paginator-increment')).nativeElement.click();
    fixture.detectChanges();

    // Page 2.
    expectJobsRendered(fakeJobService.jobs.slice(3, 5));
  }));

  it('paginates backwards', fakeAsync(() => {
    fakeJobService.jobs = testJobs(5);
    tick();
    fixture.detectChanges();
    const de: DebugElement = fixture.debugElement;
    de.query(By.css('.mat-paginator-increment')).nativeElement.click();
    fixture.detectChanges();

    // Back to page 1, which should have the first 3 jobs.
    de.query(By.css('.mat-paginator-decrement')).nativeElement.click();
    fixture.detectChanges();
    expectJobsRendered(fakeJobService.jobs.slice(0, 3));
  }));

  it('reloads properly on filter', fakeAsync(() => {
    const jobs: QueryJobsResult[] = testJobs(5);
    jobs[1].status = JobStatus.Succeeded;
    jobs[3].status = JobStatus.Aborted;
    fakeJobService.jobs = jobs;
    tick();
    fixture.detectChanges();

    let de: DebugElement = fixture.debugElement;
    de.query(By.css('.completed-button')).nativeElement.click();
    tick();
    fixture.detectChanges();
    expectJobsRendered([jobs[1], jobs[3]]);
  }));

  it('reloads properly on abort', fakeAsync(() => {
    const jobs = testJobs(5);
    fakeJobService.jobs = jobs;
    tick();
    fixture.detectChanges();

    // Filter by active to filter out jobs after they've been aborted.
    let de: DebugElement = fixture.debugElement;
    de.query(By.css('.active-button')).nativeElement.click();
    tick();
    fixture.detectChanges();

    // We select the first page (3 jobs) and abort. Jobs 3 and 4 are unaffected.
    let component = de.query(By.css('jm-job-list-table')).componentInstance;
    component.toggleSelectAll();
    tick();
    fixture.detectChanges();

    de.query(By.css('.group-abort')).nativeElement.click();
    tick();
    fixture.detectChanges();

    // Jobs 3 and 4 should be the only jobs displayed, as they are the only
    // remaining active jobs.
    expectJobsRendered(jobs.slice(3, 5));
  }));

  it('pagination resets on filter', fakeAsync(() => {
    const jobs = testJobs(5);
    jobs[3].status = JobStatus.Failed;
    fakeJobService.jobs = jobs;
    tick();
    fixture.detectChanges();

    const de: DebugElement = fixture.debugElement;
    de.query(By.css('.mat-paginator-increment')).nativeElement.click();
    fixture.detectChanges();

    de.query(By.css('.failed-button')).nativeElement.click();
    tick();
    fixture.detectChanges();
    expectJobsRendered([jobs[3]]);
  }));

  @Component({
    selector: 'jm-test-app',
    template: '<router-outlet></router-outlet>'
  })
  class AppComponent {}

  @Component({
    selector: 'jm-test-job-list-component',
    template: '<jm-job-list [pageSize]="3"></jm-job-list>'
  })
  class TestJobListComponent {}
});
