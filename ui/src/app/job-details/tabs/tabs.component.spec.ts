import {TestBed, async, ComponentFixture} from '@angular/core/testing';
import {By} from '@angular/platform-browser';
import {CommonModule} from '@angular/common';
import {Component, DebugElement, ViewChild} from '@angular/core';
import {
  MatButtonModule,
  MatExpansionModule,
  MatMenuModule, MatSnackBar,
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

describe('JobTabsComponent', () => {
  let testComponent: TestTasksComponent;
  let fixture: ComponentFixture<TestTasksComponent>;
  let fakeJobService: FakeJobManagerService;

  let task: TaskMetadata = {
    name: 'task1',
    executionStatus: 'Failed',
    start: new Date('2017-11-14T13:00:00'),
    end: new Date('2017-11-14T13:15:00'),
    attempts: 1,
    returnCode: 0,
    stderr: 'gs://test-bucket/stderr.txt',
    stdout: 'gs://test-bucket/stdout.txt',
    inputs: {},
    jobId: 'subworkflow123',
    attemptsData: []
  }

  let job: JobMetadataResponse = {
    id: 'test-id',
    name: 'test-name',
    status: JobStatus.Failed,
    submission: new Date('2015-04-20T20:00:00'),
    extensions: { tasks: [task] },
  }
  let snackBar: MatSnackBar;

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
        MatButtonModule,
        MatExpansionModule,
        MatMenuModule,
        MatTableModule,
        MatTabsModule,
        MatTooltipModule,
        Ng2GoogleChartsModule,
        SharedModule
      ],
      providers: [
        {provide: AuthService, useValue: new AuthService(null, new FakeCapabilitiesService({}), null, snackBar)},
        {provide: JobManagerService, useValue: fakeJobService},

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
    expect(de.queryAll(By.css('.list-row')).length).toEqual(testComponent.job.extensions.tasks.length);
  }));

  it('should display task data in each row', async(() => {
    fixture.detectChanges();
    let de: DebugElement = fixture.debugElement;
    expect(de.queryAll(By.css('.task-name'))[1].nativeElement.textContent)
      .toContain(task.name);
    expect(de.queryAll(By.css('a.title-link')).length)
      .toEqual(1);
    expect(de.query(By.css('.task-status clr-icon')).attributes['shape'])
      .toContain('error');
    expect(de.queryAll(By.css('.task-start'))[1].nativeElement.textContent)
      .toContain('Nov 14, 2017');
    expect(de.queryAll(By.css('.task-duration'))[1].nativeElement.textContent.trim())
      .toEqual('0h 15m');
    expect(de.queryAll(By.css('.task-attempts'))[1].nativeElement.textContent.trim())
      .toEqual('');
    expect(de.queryAll(By.css('.task-links a.log-item'))[0].properties['href'])
      .toContain('stdout.txt');
    expect(de.queryAll(By.css('.task-links a.log-item'))[1].properties['href'])
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
