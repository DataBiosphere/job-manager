import {TestBed, async, ComponentFixture, fakeAsync, tick} from '@angular/core/testing';
import {By} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {Component, ViewChild} from '@angular/core';
import {
  MatDividerModule,
  MatExpansionModule,
  MatSnackBarModule,
  MatTabsModule,
  MatTableModule
} from '@angular/material';
import {SharedModule} from '../../shared/shared.module';
import {JobStatus} from '../../shared/model/JobStatus';
import {JobMetadataResponse} from '../../shared/model/JobMetadataResponse';
import {JobResourcesComponent} from './resources.component';
import {JobResourcesTableComponent} from './resources-table/resources-table.component';
import {GcsService} from '../../core/gcs.service';
import {FakeGcsService} from '../../testing/fake-gcs.service';

describe('JobResourcesComponent', () => {

  let testComponent: TestResourcesComponent;
  let fixture: ComponentFixture<TestResourcesComponent>;
  let minimalJob: JobMetadataResponse =
    {
      id: 'JOB1',
      status: JobStatus.Running,
      submission: new Date('1994-03-29T20:30:00'),
      start: new Date('1994-03-29T21:00:00')
    };

  let inputOutputSourceFileJob: JobMetadataResponse =
    {
      id: 'JOB1',
      status: JobStatus.Aborted,
      submission: new Date('1994-03-29T20:30:00'),
      name: 'Job 1 name',
      start: new Date('1994-03-29T21:00:00'),
      end: new Date('1994-03-29T22:00:00'),
      inputs: {'input': 'gs://input/url/', 'input_file': 'gs://input/url/inputs.txt'},
      outputs: {'output': 'gs://output/url/', 'output_file': 'gs://output/url/outputs.txt'},
      labels: {'user-id': 'user-1', 'project': 'test-pipeline'},
      extensions: {
        sourceFile: 'TEST_SCRIPT',

      }
    };

  let eventDetailsJob: JobMetadataResponse =
    {
      id: 'JOB1',
      status: JobStatus.Aborted,
      submission: new Date('1994-03-29T20:30:00'),
      name: 'Job 1 name',
      start: new Date('1994-03-29T21:00:00'),
      end: new Date('1994-03-29T22:00:00'),
      inputs: {'input': 'gs://input/url/', 'input_file': 'gs://input/url/inputs.txt'},
      outputs: {'output': 'gs://output/url/', 'output_file': 'gs://output/url/outputs.txt'},
      labels: {'user-id': 'user-1', 'project': 'test-pipeline'},
      extensions: {
        sourceFile: 'TEST_SCRIPT',
        events: [
          {
            content: 'start',
            time: new Date('2018-05-24T21:42:49.699649148Z')
          },
          {
            content: 'pulling-image',
            time: new Date('2018-05-24T21:42:49.699699675Z')
          }
        ]
      }
    };

  let logsJob: JobMetadataResponse =
    {
      id: 'JOB1',
      status: JobStatus.Aborted,
      submission: new Date('1994-03-29T20:30:00'),
      name: 'Job 1 name',
      start: new Date('1994-03-29T21:00:00'),
      end: new Date('1994-03-29T22:00:00'),
      extensions: {
        logs: {
          'Controller Log': 'gs://test-bucket/controller-log',
          'Output Log': 'gs://test-bucket/stdout',
          'Error Log': 'gs://test-bucket/stderr',
        }
      }
    };

  let objectDataMap: Map<string, string> = new Map([
    ['controller-log', 'CONTROLLER LOG TEXT'],
    ['stdout', 'OUTPUT LOG TEXT'],
    ['stderr', 'ERROR LOG TEXT'],
  ]);

  let objectSizeMap: Map<string, number> = new Map([
    ['controller-log', 1000],
    ['stdout', 2000],
    ['stderr', 1000000], // 10MB should hit limit
  ]);

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        JobResourcesComponent,
        JobResourcesTableComponent,
        TestResourcesComponent
      ],
      imports: [
        BrowserAnimationsModule,
        MatDividerModule,
        MatExpansionModule,
        MatSnackBarModule,
        MatTabsModule,
        MatTableModule,
        SharedModule
      ],
      providers: [{
        provide: GcsService,
        useValue: new FakeGcsService('test-bucket', objectSizeMap, objectDataMap)
      }]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TestResourcesComponent);
    testComponent = fixture.componentInstance;
  });

  it('should hide resources tabs for minimal job', async(() => {
    testComponent.job = minimalJob;
    fixture.detectChanges();
    let tabGroup = fixture.debugElement.queryAll(By.css('.mat-tab-group'))[0];
    expect(tabGroup.componentInstance._tabs.length).toBe(0);
  }));

  it('should show source file tab', async(() => {
    testComponent.job = inputOutputSourceFileJob;
    fixture.detectChanges();
    let tabGroup = fixture.debugElement.queryAll(By.css('.mat-tab-group'))[0];
    expect(tabGroup.componentInstance._tabs.length).toBe(1);
  }));

  it('should show source file and event details tabs', async(() => {
    testComponent.job = eventDetailsJob;
    fixture.detectChanges();
    let tabGroup = fixture.debugElement.queryAll(By.css('.mat-tab-group'))[0];
    expect(tabGroup.componentInstance._tabs.length).toBe(2);
  }));

  it('should switch content when tabs switch', fakeAsync(() => {
    testComponent.job = inputOutputSourceFileJob;
    fixture.detectChanges();
    let tabGroup = fixture.debugElement.queryAll(By.css('.mat-tab-group'))[0];

    tabGroup.componentInstance.selectedIndex = 1;
    tick();
    fixture.detectChanges();
    expect(testComponent.jobResourcesComponent.currentTabId).toBe("source-file");
  }));

  it('should retrieve log files from GCS service', fakeAsync(() => {
    testComponent.job = logsJob;
    fixture.detectChanges();
    tick();
    fixture.detectChanges();
    tick();
    let tabGroup = fixture.debugElement.queryAll(By.css('.mat-tab-group'))[0];
    expect(tabGroup.componentInstance._tabs.length).toBe(3);

    tabGroup.componentInstance.selectedIndex = 1;
    tick();
    fixture.detectChanges();
    expect(testComponent.jobResourcesComponent.currentTabId).toBe("log-Controller Log");
    let resourceContent = fixture.debugElement.queryAll(By.css('.inline-text'))[0];
    expect(resourceContent.nativeElement.innerText).toContain("CONTROLLER LOG TEXT");

    tabGroup.componentInstance.selectedIndex = 2;
    tick();
    fixture.detectChanges();
    expect(testComponent.jobResourcesComponent.currentTabId).toBe("log-Error Log");
    resourceContent = fixture.debugElement.queryAll(By.css('.inline-text'))[0];
    expect(resourceContent.nativeElement.innerText)
      .toContain("Truncated download at 1MB");

    tabGroup.componentInstance.selectedIndex = 3;
    tick();
    fixture.detectChanges();
    expect(testComponent.jobResourcesComponent.currentTabId).toBe("log-Output Log");
    expect(fixture.debugElement.queryAll(By.css('.inline-text'))[0].nativeElement.toString())
    resourceContent = fixture.debugElement.queryAll(By.css('.inline-text'))[0];
    expect(resourceContent.nativeElement.innerText).toContain("OUTPUT LOG TEXT");
  }));

  @Component({
    selector: 'jm-test-resources-component',
    template: `<jm-resources [job]="job"></jm-resources>`
  })
  class TestResourcesComponent {
    public job: JobMetadataResponse = {
      id: '',
      status: JobStatus.Failed,
      submission: new Date(),
      start: new Date()
    };
    @ViewChild(JobResourcesComponent)
    public jobResourcesComponent: JobResourcesComponent;
  }
});
