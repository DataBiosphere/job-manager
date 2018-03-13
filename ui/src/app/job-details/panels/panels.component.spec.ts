import {TestBed, async, ComponentFixture, fakeAsync, tick} from '@angular/core/testing';
import {By} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {Component, DebugElement, ViewChild} from '@angular/core';
import {MatButtonModule, MatCardModule, MatMenuModule, MatTabsModule, MatTableModule} from '@angular/material';
import {SharedModule} from '../../shared/shared.module';
import {JobStatus} from '../../shared/model/JobStatus';
import {JobMetadataResponse} from '../../shared/model/JobMetadataResponse';
import {JobPanelsComponent} from './panels.component';
import {ResourcesTableComponent} from './resources-table/resources-table.component';


describe('JobPanelsComponent', () => {

  let testComponent: TestPanelsComponent;
  let fixture: ComponentFixture<TestPanelsComponent>;
  let minimalJob: JobMetadataResponse =
    {
      id: 'JOB1',
      status: JobStatus.Running,
      submission: new Date('1994-03-29T20:30:00'),
      start: new Date('1994-03-29T21:00:00')
    };
  let completeJob: JobMetadataResponse =
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
        logs: {'log' : 'gs://logs/url'}
      }
    };

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        JobPanelsComponent,
        ResourcesTableComponent,
        TestPanelsComponent
      ],
      imports: [
        BrowserAnimationsModule,
        MatButtonModule,
        MatCardModule,
        MatMenuModule,
        MatTabsModule,
        MatTableModule,
        SharedModule
      ]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TestPanelsComponent);
    testComponent = fixture.componentInstance;
  });

  it('should display with minimal job', async(() => {
    testComponent.job = minimalJob;
    fixture.detectChanges();
    let de: DebugElement = fixture.debugElement;
    expect(de.query(By.css('.header')).nativeElement.textContent).toEqual('');
    expect(de.query(By.css('.job-id')).nativeElement.textContent)
      .toContain(minimalJob.id);
  }));

  it('should hide input buttons with minimal job', async(() => {
    testComponent.job = minimalJob;
    fixture.detectChanges();
    expect(testComponent.jobPanelsComponent.hasInputs()).toBeFalsy();
    expect(testComponent.jobPanelsComponent.hasOutputs()).toBeFalsy();
    expect(testComponent.jobPanelsComponent.hasLogs()).toBeFalsy();
    expect(fixture.debugElement.query(By.css('.view-resources-button')))
      .toBeNull();
  }));

  it('should display all features with complete job', async(() => {
    testComponent.job = completeJob;
    fixture.detectChanges();
    let de: DebugElement = fixture.debugElement;
    let labels = de.queryAll(By.css('.text-info'));
    expect(labels.length).toEqual(2);
    expect(labels[0].nativeElement.textContent).toContain(completeJob.labels['project']);
    expect(labels[1].nativeElement.textContent).toContain(completeJob.labels['user-id']);
    expect(de.query(By.css('#ended')).nativeElement.textContent)
      .toContain("10:00 PM");
  }));

  it('should show inputs outputs card for complete job', async(() => {
    testComponent.job = completeJob;
    fixture.detectChanges();
    expect(testComponent.jobPanelsComponent.hasInputs()).toBeTruthy();
    expect(testComponent.jobPanelsComponent.hasOutputs()).toBeTruthy();
    expect(testComponent.jobPanelsComponent.hasLogs()).toBeTruthy();
  }));

  it('should display correct input file names', fakeAsync(() => {
    testComponent.job = completeJob;
    fixture.detectChanges();
    let tabs = fixture.debugElement.queryAll(By.css('.input-output-tabs'))[0];
    tabs.componentInstance.selectedIndex = 0;
    fixture.detectChanges();
    tick();
    let inputsTable = fixture.debugElement.queryAll(By.css('.resources-table'))[0];
    let items = inputsTable.nativeElement.children;
    expect(items[0].textContent).toContain(testComponent.job.inputs['input']);
    expect(items[1].textContent).toContain('inputs.txt');
  }));

  it('should display correct output file names', fakeAsync(() => {
    testComponent.job = completeJob;
    fixture.detectChanges();
    let tabs = fixture.debugElement.queryAll(By.css('.input-output-tabs'))[0];
    tabs.componentInstance.selectedIndex = 1;
    fixture.detectChanges();
    tick();
    let outputsTable = fixture.debugElement.queryAll(By.css('.resources-table'))[1];
    let items = outputsTable.nativeElement.children;
    expect(items[0].textContent).toContain(testComponent.job.outputs['output']);
    expect(items[1].textContent).toContain('outputs.txt');
  }));

  @Component({
    selector: 'jm-test-panels-component',
    template: `<jm-panels [job]="job"></jm-panels>`
  })
  class TestPanelsComponent {
    public job: JobMetadataResponse = {
      id: '',
      status: JobStatus.Failed,
      submission: new Date(),
      start: new Date()
    };
    @ViewChild(JobPanelsComponent)
    public jobPanelsComponent: JobPanelsComponent;
  }
});
