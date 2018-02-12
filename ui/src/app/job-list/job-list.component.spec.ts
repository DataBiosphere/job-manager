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

import {JobListComponent} from "./job-list.component"
import {JobsTableComponent} from "./table/table.component"
import {JobManagerService} from '../core/job-manager.service';
import {FakeJobManagerService} from '../testing/fake-job-manager.service';
import {SharedModule} from '../shared/shared.module';
import {JobStream} from "../shared/job-stream";
import {ActivatedRoute} from "@angular/router";
import {Observable} from "rxjs/Observable";
import 'rxjs/add/observable/of';
import {QueryJobsResult} from '../shared/model/QueryJobsResult';
import {JobStatus} from "../shared/model/JobStatus";

describe('JobListComponent', () => {

  // Jobs with IDs JOB0 -> JOB4.
  function testJobs(): QueryJobsResult[] {
    const base = {
      status: JobStatus.Running,
      submission: new Date('2015-04-20T20:00:00')
    };
    return (new Array(5)).map((_, i) => {
      return {
        ...base,
        id: `JOB${i}`
      };
    });
  }

  let testComponent: TestJobListComponent;
  let fixture: ComponentFixture<TestJobListComponent>;
  let jobStream: JobStream;

  beforeEach(async(() => {
    const svc = new FakeJobManagerService(testJobs());
    jobStream = new JobStream(svc, {})
    const routeStub = {
      snapshot: {
        data: {stream: jobStream},
        queryParams: Observable.of({q: 'query'}),
      },
      queryParams: Observable.of({q: 'query'}),
      params: Observable.of({q: 'query'})
    };

    TestBed.configureTestingModule({
      declarations: [
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
          {path: '', component: TestJobListComponent},
          {path: 'jobs', component: TestJobListComponent}
        ]),
        SharedModule
      ],
      providers: [
        {provide: ActivatedRoute, useValue: routeStub},
        {provide: JobManagerService, useValue: svc}
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TestJobListComponent);
    testComponent = fixture.componentInstance;
    fixture.detectChanges();
  });

  it ('displays error message bar', async(() => {
    let error = {
      status: 400,
      title: 'Bad Request',
      message: 'Missing required field `parentId`'
    };
    testComponent.jobListComponent.handleError(error);
    fixture.detectChanges();
    let de: DebugElement = fixture.debugElement;
    expect(de.query(By.css('.mat-simple-snackbar')).nativeElement.textContent)
      .toEqual("Bad Request (400): Missing required field `parentId` Dismiss");
  }));

  it ('renders job rows', fakeAsync(() => {
    jobStream.loadAtLeast(3);
    tick();
    fixture.detectChanges();
    let de: DebugElement = fixture.debugElement;
    expect(de.queryAll(By.css('.mat-row')).length).toEqual(3);
  }));

  @Component({
    selector: 'jm-test-job-list-component',
    template: '<jm-job-list [pageSize]="3"></jm-job-list>'
  })
  class TestJobListComponent {
    @ViewChild(JobListComponent)
    public jobListComponent: JobListComponent;
  }
});
