import {TestBed, async, ComponentFixture} from '@angular/core/testing';
import {By} from '@angular/platform-browser';
import {CommonModule} from '@angular/common';
import {Component, DebugElement, ViewChild} from '@angular/core';
import {
  MatButtonModule,
  MatExpansionModule,
  MatMenuModule,
  MatTableModule,
  MatTabsModule,
  MatTooltipModule,
} from '@angular/material';
import {ClrIconModule, ClrTooltipModule} from '@clr/angular';
import {Ng2GoogleChartsModule} from 'ng2-google-charts';

import {BrowserAnimationsModule} from "@angular/platform-browser/animations";
import {JobFailuresTableComponent} from "../common/failures-table/failures-table.component";
import {JobMetadataResponse} from '../../shared/model/JobMetadataResponse';
import {JobStatus} from '../../shared/model/JobStatus';
import {SharedModule} from '../../shared/shared.module';
import {JobTabsComponent} from './tabs.component';
import {TaskMetadata} from "../../shared/model/TaskMetadata";
import {JobResourcesTableComponent} from "../resources/resources-table/resources-table.component";
import {JobTimingDiagramComponent} from "./timing-diagram/timing-diagram.component";

describe('JobTabsComponent', () => {
  let testComponent: TestTasksComponent;
  let fixture: ComponentFixture<TestTasksComponent>;

  let task: TaskMetadata = {
    name: 'task1',
    executionId: '',
    executionStatus: 'Failed',
    start: new Date("2017-11-14T13:00:00"),
    end: new Date("2017-11-14T13:15:00"),
    attempts: 1,
    failures: [],
    returnCode: 0,
    stderr: 'gs://test-bucket/stderr.txt',
    stdout: 'gs://test-bucket/stdout.txt',
    inputs: {},
    jobId: 'subworkflow123'
  }

  let job: JobMetadataResponse = {
    id: 'test-id',
    name: 'test-name',
    status: JobStatus.Failed,
    submission: new Date('2015-04-20T20:00:00'),
    extensions: { tasks: [task] }
  }

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        JobTabsComponent,
        JobFailuresTableComponent,
        JobResourcesTableComponent,
        JobTimingDiagramComponent,
        TestTasksComponent
      ],
      imports: [
        BrowserAnimationsModule,
        ClrIconModule,
        ClrTooltipModule,
        CommonModule,
        MatButtonModule,
        MatExpansionModule,
        MatMenuModule,
        MatTableModule,
        MatTabsModule,
        MatTooltipModule,
        Ng2GoogleChartsModule,
        SharedModule
      ]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TestTasksComponent);
    testComponent = fixture.componentInstance;
  });

  it('should display a row for each task', async(() => {
    fixture.detectChanges();
    let de: DebugElement = fixture.debugElement;
    expect(de.queryAll(By.css('.mat-row')).length).toEqual(testComponent.job.extensions.tasks.length);
  }));

  it('should display task data in each row', async(() => {
    fixture.detectChanges();
    let de: DebugElement = fixture.debugElement;
    expect(de.query(By.css('.title-link')).nativeElement.textContent)
      .toContain(task.name);
    expect(de.queryAll(By.css('a.title-link')).length)
      .toEqual(1);
    expect(de.query(By.css('.mat-column-status clr-icon')).attributes['shape'])
      .toContain('error');
    expect(de.queryAll(By.css('.mat-column-startTime'))[1].nativeElement.textContent)
      .toContain('Nov 14, 2017');
    expect(de.queryAll(By.css('.mat-column-duration'))[1].nativeElement.textContent)
      .toEqual('0h 15m');
    expect(de.queryAll(By.css('.mat-column-attempts'))[1].nativeElement.textContent)
      .toEqual(task.attempts.toString());
    expect(de.queryAll(By.css('.mat-column-files a.log-item'))[0].properties['href'])
      .toContain('stdout.txt');
    expect(de.queryAll(By.css('.mat-column-files a.log-item'))[1].properties['href'])
      .toContain('stderr.txt');
  }));

  @Component({
    selector: 'jm-test-tasks-component',
    template: `<jm-tabs [tasks]="job.extensions.tasks" [job]="job"></jm-tabs>`
  })
  class TestTasksComponent {
    public job = job;
    @ViewChild(JobTabsComponent)
    public jobTabsComponent: JobTabsComponent;
  }
});
