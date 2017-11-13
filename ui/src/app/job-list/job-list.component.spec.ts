import {async, ComponentFixture, TestBed} from '@angular/core/testing';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {By} from '@angular/platform-browser';
import {CommonModule} from '@angular/common';
import {Component, DebugElement, ViewChild} from '@angular/core';
import {
  MdButtonModule,
  MdCardModule,
  MdMenuModule,
  MdSortModule,
  MdTableModule,
  MdTabsModule,
  MdPaginatorModule,
  MdSnackBarModule,
  MdTooltipModule,
  MdInputModule,
  MdCheckboxModule
} from '@angular/material';
import {RouterTestingModule} from '@angular/router/testing';

import {JobListView} from "../shared/job-stream";
import {JobListComponent} from "./job-list.component"
import {JobsTableComponent} from "./table/table.component"
import {JobMonitorService} from '../core/job-monitor.service';
import {JobStatus} from '../shared/model/JobStatus';
import {newDefaultMockJobMonitorService} from '../shared/mock-job-monitor.service';
import {QueryJobsResult} from '../shared/model/QueryJobsResult';
import {SharedModule} from '../shared/shared.module';
import {environment} from '../../environments/environment';
import {dsubAdditionalColumns} from '../../environments/additional-columns.config';

describe('JobListComponent', () => {

  let testComponent: TestJobListComponent;
  let fixture: ComponentFixture<TestJobListComponent>;

  beforeEach(async(() => {

    TestBed.configureTestingModule({
      declarations: [
        JobListComponent,
        TestJobListComponent,
        JobsTableComponent
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
        MdSnackBarModule,
        MdSortModule,
        MdTableModule,
        MdTabsModule,
        MdTooltipModule,
        RouterTestingModule.withRoutes([
          {path: '', redirectTo: 'jobs', pathMatch: 'full'},
          {path: 'jobs', component: TestJobListComponent}
        ]),
        SharedModule
      ],
      providers: [
        {provide: JobMonitorService, userValue: newDefaultMockJobMonitorService()}
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TestJobListComponent);
    testComponent = fixture.componentInstance;
  });

  it ('displays error message bar', async(() => {
    let error = {
      status: 400,
      title: 'Bad Request',
      message: 'Missing required field `parentId`'
    }
    testComponent.jobListComponent.handleError(error);
    fixture.detectChanges();
    let de: DebugElement = fixture.debugElement;
    expect(de.query(By.css('.mat-simple-snackbar')).nativeElement.textContent)
      .toEqual("Bad Request (400): Missing required field `parentId` Dismiss");
  }))

  @Component({
    selector: 'jm-test-job-list-component',
    template: '<jm-job-list></jm-job-list>'
  })
  class TestJobListComponent {
    @ViewChild(JobListComponent)
    public jobListComponent: JobListComponent;
  }
});
