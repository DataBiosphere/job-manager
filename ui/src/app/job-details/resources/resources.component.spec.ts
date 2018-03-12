import {TestBed, async, ComponentFixture, fakeAsync, tick} from '@angular/core/testing';
import {By} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {Component, ViewChild} from '@angular/core';
import {
  MatDividerModule,
  MatExpansionModule,
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

  let inputOutputScriptJob: JobMetadataResponse =
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
        script: 'TEST_SCRIPT'
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

  let gcsObjects: Map<string, string> = new Map([
    ['controller-log', 'CONTROLLER LOG TEXT'],
    ['stdout', 'OUTPUT LOG TEXT'],
    ['stderr', 'ERROR LOG TEXT'],
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
        MatTabsModule,
        MatTableModule,
        SharedModule
      ],
      providers: [
        {provide: GcsService, useValue: new FakeGcsService('test-bucket', gcsObjects)}
      ]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TestResourcesComponent);
    testComponent = fixture.componentInstance;
  });

  it('should hide resources tabs for minimal job', async(() => {
    testComponent.job = minimalJob;
    fixture.detectChanges();
    expect(testComponent.jobResourcesComponent.hasInputs()).toBeFalsy();
    expect(testComponent.jobResourcesComponent.hasOutputs()).toBeFalsy();
    expect(testComponent.jobResourcesComponent.hasScript()).toBeFalsy();
    let tabGroup = fixture.debugElement.queryAll(By.css('.mat-tab-group'))[0];
    expect(tabGroup.componentInstance._tabs.length).toBe(0);
  }));

  it('should show inputs, outputs, script tabs', async(() => {
    testComponent.job = inputOutputScriptJob;
    fixture.detectChanges();
    expect(testComponent.jobResourcesComponent.hasInputs()).toBeTruthy();
    expect(testComponent.jobResourcesComponent.hasOutputs()).toBeTruthy();
    expect(testComponent.jobResourcesComponent.hasScript()).toBeTruthy();
    let tabGroup = fixture.debugElement.queryAll(By.css('.mat-tab-group'))[0];
    expect(tabGroup.componentInstance._tabs.length).toBe(3);
  }));

  it('should switch content when tabs switch', fakeAsync(() => {
    testComponent.job = inputOutputScriptJob;
    fixture.detectChanges();
    expect(testComponent.jobResourcesComponent.hasInputs()).toBeTruthy();
    expect(testComponent.jobResourcesComponent.hasOutputs()).toBeTruthy();
    expect(testComponent.jobResourcesComponent.hasScript()).toBeTruthy();
    let tabGroup = fixture.debugElement.queryAll(By.css('.mat-tab-group'))[0];

    tabGroup.componentInstance.selectedIndex = 1;
    tick();
    fixture.detectChanges();
    expect(testComponent.jobResourcesComponent.currentResourcesTab).toBe("Inputs");

    tabGroup.componentInstance.selectedIndex = 2;
    tick();
    fixture.detectChanges();
    expect(testComponent.jobResourcesComponent.currentResourcesTab).toBe("Outputs");

    tabGroup.componentInstance.selectedIndex = 3;
    tick();
    fixture.detectChanges();
    expect(testComponent.jobResourcesComponent.currentResourcesTab).toBe("Script");
  }));

  it('should retrieve log files from GCS service', fakeAsync(() => {
    testComponent.job = logsJob;
    fixture.detectChanges();
    let tabGroup = fixture.debugElement.queryAll(By.css('.mat-tab-group'))[0];
    expect(tabGroup.componentInstance._tabs.length).toBe(3);

    tabGroup.componentInstance.selectedIndex = 1;
    tick();
    fixture.detectChanges();
    expect(testComponent.jobResourcesComponent.currentResourcesTab).toBe("Controller Log");
    let resourceContent = fixture.debugElement.queryAll(By.css('.inline-text'))[0];
    expect(resourceContent.nativeElement.innerText).toContain("CONTROLLER LOG TEXT");

    tabGroup.componentInstance.selectedIndex = 2;
    tick();
    fixture.detectChanges();
    expect(testComponent.jobResourcesComponent.currentResourcesTab).toBe("Error Log");
    resourceContent = fixture.debugElement.queryAll(By.css('.inline-text'))[0];
    expect(resourceContent.nativeElement.innerText).toContain("ERROR LOG TEXT");

    tabGroup.componentInstance.selectedIndex = 3;
    tick();
    fixture.detectChanges();
    expect(testComponent.jobResourcesComponent.currentResourcesTab).toBe("Output Log");
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
