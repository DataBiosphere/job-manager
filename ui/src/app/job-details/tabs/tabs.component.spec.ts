import {HttpClientModule} from "@angular/common/http";
import {TestBed, async, ComponentFixture} from '@angular/core/testing';
import {By, DomSanitizer} from '@angular/platform-browser';
import {CommonModule} from '@angular/common';
import {Component, DebugElement, ViewChild} from '@angular/core';
import {
  MatButtonModule,
  MatExpansionModule,
  MatIconModule, MatIconRegistry,
  MatMenuModule,
  MatSnackBarModule,
  MatTableModule,
  MatTabsModule,
  MatTooltipModule,
} from '@angular/material';
import {ClrIconModule, ClrTooltipModule} from '@clr/angular';
import {Ng2GoogleChartsModule} from 'ng2-google-charts';

import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {JobFailuresTableComponent} from '../common/failures-table/failures-table.component';
import {JobDebugIconsComponent} from "../common/debug-icons/debug-icons.component";
import {AuthService} from '../../core/auth.service';
import {JobMetadataResponse} from '../../shared/model/JobMetadataResponse';
import {JobStatus} from '../../shared/model/JobStatus';
import {SharedModule} from '../../shared/shared.module';
import {JobTabsComponent} from './tabs.component';
import {FakeCapabilitiesService} from '../../testing/fake-capabilities.service';
import {TaskMetadata} from '../../shared/model/TaskMetadata';
import {JobResourcesTableComponent} from '../resources/resources-table/resources-table.component';
import {JobTimingDiagramComponent} from './timing-diagram/timing-diagram.component';
import {JobAttemptComponent} from "../common/attempt/attempt.component";
import {JobManagerService} from "../../core/job-manager.service";
import {FakeJobManagerService} from "../../testing/fake-job-manager.service";
import {GcsService} from "../../core/gcs.service";
import {FakeGcsService} from "../../testing/fake-gcs.service";
import {CapabilitiesService} from "../../core/capabilities.service";

describe('JobTabsComponent', () => {
  let testComponent: TestTasksComponent;
  let fixture: ComponentFixture<TestTasksComponent>;
  let iconRegistry;
  let sanitizer;
  let fakeJobService: FakeJobManagerService;
  let tasks: TaskMetadata[] = [];
  let fakeCapabilitiesService = new FakeCapabilitiesService({});

  let task: TaskMetadata = {
    name: 'task1',
    executionStatus: 'Failed',
    start: new Date('2017-11-14T13:00:00'),
    end: new Date('2017-11-14T13:15:00'),
    attempts: 1,
    returnCode: 0,
    callCached: false,
    stderr: 'gs://test-bucket/stderr.txt',
    stdout: 'gs://test-bucket/stdout.txt',
    callRoot: 'gs://test-bucket',
    inputs: {},
    outputs: {},
    jobId: 'subworkflow123',
    attemptsData: []
  };
  tasks.push(task);

  let callCachedTask: TaskMetadata = {
    name: 'task2',
    executionStatus: 'Succeeded',
    start: new Date('2017-11-14T13:00:00'),
    end: new Date('2017-11-14T13:15:00'),
    attempts: 1,
    returnCode: 0,
    callCached: true,
    stderr: 'gs://test-bucket/stderr.txt',
    stdout: 'gs://test-bucket/stdout.txt',
    callRoot: 'gs://test-bucket',
    inputs: {},
    outputs: {},
    attemptsData: []
  };
  tasks.push(callCachedTask);

  let taskWithInput: TaskMetadata = {
    name: 'task3',
    executionStatus: 'Succeeded',
    start: new Date('2017-11-14T13:00:00'),
    end: new Date('2017-11-14T13:15:00'),
    attempts: 1,
    returnCode: 0,
    callCached: false,
    stderr: 'gs://test-bucket/stderr.txt',
    stdout: 'gs://test-bucket/stdout.txt',
    callRoot: 'gs://test-bucket',
    inputs: {'string': 'hello world'},
    outputs: {},
    attemptsData: []
  };
  tasks.push(taskWithInput);

  let taskWithOutput: TaskMetadata = {
    name: 'task4',
    executionStatus: 'Succeeded',
    start: new Date('2017-11-14T13:00:00'),
    end: new Date('2017-11-14T13:15:00'),
    attempts: 1,
    returnCode: 0,
    callCached: false,
    stderr: 'gs://test-bucket/stderr.txt',
    stdout: 'gs://test-bucket/stdout.txt',
    callRoot: 'gs://test-bucket',
    inputs: {},
    outputs: {'string': 'hello world'},
    attemptsData: []
  };
  tasks.push(taskWithOutput);

  let taskWithTwoAttempts: TaskMetadata = {
    name: 'task5',
    executionStatus: 'Succeeded',
    start: new Date('2017-11-14T13:00:00'),
    end: new Date('2017-11-14T13:15:00'),
    attempts: 2,
    returnCode: 0,
    callCached: false,
    stderr: 'gs://test-bucket/stderr.txt',
    stdout: 'gs://test-bucket/stdout.txt',
    callRoot: 'gs://test-bucket',
    inputs: {},
    outputs: {},
    attemptsData: []
  };
  tasks.push(taskWithTwoAttempts);

  let job: JobMetadataResponse = {
    id: 'test-id',
    name: 'test-name',
    status: JobStatus.Failed,
    submission: new Date('2015-04-20T20:00:00'),
    extensions: { tasks: tasks },
  };

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        JobAttemptComponent,
        JobDebugIconsComponent,
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
        HttpClientModule,
        MatButtonModule,
        MatExpansionModule,
        MatIconModule,
        MatMenuModule,
        MatSnackBarModule,
        MatTableModule,
        MatTabsModule,
        MatTooltipModule,
        Ng2GoogleChartsModule,
        SharedModule
      ],
      providers: [
        {provide: GcsService, useValue: new FakeGcsService('test-bucket', null, null)},
        {provide: AuthService, useValue: new AuthService(null, fakeCapabilitiesService, null, null)},
        {provide: JobManagerService, useValue: fakeJobService},
        {provide: CapabilitiesService, useValue: fakeCapabilitiesService},
      ]
    }).compileComponents();
  }));

  beforeEach(() => {
    iconRegistry = TestBed.get(MatIconRegistry);
    sanitizer = TestBed.get(DomSanitizer);
    iconRegistry.addSvgIcon('cloud-file', sanitizer.bypassSecurityTrustResourceUrl('/assets/images/icon-cloud-file.svg'));
    fixture = TestBed.createComponent(TestTasksComponent);
    testComponent = fixture.componentInstance;
  });

  it('should display a row for each task', async(() => {
    fixture.detectChanges();
    let de: DebugElement = fixture.debugElement;
    expect(de.queryAll(By.css('.list-row')).length).toEqual(testComponent.job.extensions.tasks.length);
  }));

  it('should display task data in each row', async(() => {
    fixture.detectChanges();
    let de: DebugElement = fixture.debugElement;

    expect(de.queryAll(By.css('mat-expansion-panel.list-row div.task-name')).length)
      .toEqual(tasks.length);
    expect(de.queryAll(By.css('.task-name'))[1].nativeElement.textContent)
      .toContain(task.name);
    expect(de.queryAll(By.css('a.title-link')).length)
      .toEqual(1);
    expect(de.queryAll(By.css('.task-status clr-icon'))[0].attributes['shape'])
      .toContain('error');
    expect(de.queryAll(By.css('.task-start'))[1].nativeElement.textContent)
      .toContain('Nov 14, 2017');
    expect(de.queryAll(By.css('.task-duration'))[1].nativeElement.textContent.trim())
      .toEqual('0h 15m');
    expect(de.queryAll(By.css('.task-attempts'))[1].nativeElement.textContent.trim())
      .toEqual('');
  }));

  it('should display the correct icon if the task was call cached', async(() => {
    fixture.detectChanges();
    let de: DebugElement = fixture.debugElement;

    expect(de.query(By.css('mat-expansion-panel.list-row:nth-child(3) .task-duration clr-icon')).attributes['shape'])
      .toEqual('history');
  }));

  it('should display the correct icon if the task has inputs', async(() => {
    fixture.detectChanges();
    let de: DebugElement = fixture.debugElement;

    expect(de.query(By.css('mat-expansion-panel.list-row:nth-child(4) .task-inputs clr-icon')).attributes['shape'])
      .toEqual('import');
  }));

  it('should display the correct icon if the task has outputs', async(() => {
    fixture.detectChanges();
    let de: DebugElement = fixture.debugElement;

    expect(de.query(By.css('mat-expansion-panel.list-row:nth-child(5) .task-outputs clr-icon')).attributes['shape'])
      .toEqual('export');
  }));

  it('should display attempt rows for each task attempt if there was more than one', async(() => {
    const attempts = [
      {
        attemptNumber: 1,
        callCached: false,
        callRoot: 'gs://test-bucket',
        start: new Date('2017-11-14T13:00:00'),
        end: new Date('2017-11-14T13:15:00'),
        executionStatus: 'Failed',
        failureMessages: [
          'Task failed.'
        ],
        inputs: {},
        stderr: 'gs://test-bucket/stderr.txt',
        stdout: 'gs://test-bucket/stdout.txt',
      },{
        attemptNumber: 2,
        callRoot: 'gs://test-bucket/attempt-2',
        start: new Date('2017-11-14T13:00:00'),
        end: new Date('2017-11-14T13:15:00'),
        executionStatus: 'Succeeded',
        inputs: {},
        outputs: {},
        stderr: 'gs://test-bucket/attempt-2/stderr.txt',
        stdout: 'gs://test-bucket/attempt-2/stdout.txt',
      }
    ];
    taskWithTwoAttempts.attemptsData = attempts;

    fixture.detectChanges();
    let de: DebugElement = fixture.debugElement;
    expect(de.queryAll(By.css('mat-expansion-panel.list-row div.task-name')).length)
      .toEqual(tasks.length + attempts.length);
    expect(de.queryAll(By.css('.task-attempts'))[5].nativeElement.textContent.trim())
      .toEqual('2');
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
