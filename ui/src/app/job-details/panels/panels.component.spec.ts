import {TestBed, async, ComponentFixture} from '@angular/core/testing';
import {By} from '@angular/platform-browser';
import {Component, DebugElement, ViewChild} from '@angular/core';
import {JobPanelsComponent} from './panels.component';
import {MdButtonModule, MdCardModule, MdMenuModule} from '@angular/material';

import {SharedModule} from '../../shared/shared.module';
import {JobStatus} from '../../shared/model/JobStatus';
import {JobMetadataResponse} from '../../shared/model/JobMetadataResponse';

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
      inputs: {'input': 'gs://input/url/'},
      outputs: {'output': 'gs://output/url/'},
      labels: {'user-id': 'user-1'},
    };

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        JobPanelsComponent,
        TestPanelsComponent
      ],
      imports: [
        MdButtonModule,
        MdCardModule,
        MdMenuModule,
        SharedModule,
      ]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TestPanelsComponent);
    testComponent = fixture.componentInstance;
    testComponent.jobPanelsComponent.job = {
      id: 'JOB1',
      name: 'TCG-NBL-7357',
      status: JobStatus.Running,
      submission: new Date(new Date().getTime() - 1200000),
      start: new Date(new Date().getTime() - 1200000)
    };
  });

  it('should display with minimal job', async(() => {
    testComponent.job = minimalJob;
    fixture.detectChanges();
    let de: DebugElement = fixture.debugElement;
    expect(de.query(By.css('.header')).nativeElement.textContent).toEqual('');
    expect(de.query(By.css('.job-id')).nativeElement.textContent)
      .toContain('JOB1');
    expect(de.query(By.css('.text-info')).nativeElement.textContent)
      .toEqual('Submitted by: ');
  }));

  it('should hide input buttons with minimal job', async(() => {
    testComponent.job = minimalJob;
    fixture.detectChanges();
    expect(testComponent.jobPanelsComponent.showInputsButton()).toBeFalsy();
    expect(testComponent.jobPanelsComponent.showOutputsButton()).toBeFalsy();
    expect(fixture.debugElement.query(By.css('.view-resources-button')))
      .toBeNull();
  }));

  it('should display all features with complete job', async(() => {
    testComponent.job = completeJob;
    fixture.detectChanges();
    let de: DebugElement = fixture.debugElement;
    expect(de.query(By.css('.text-info')).nativeElement.textContent)
      .toContain('user-1');
    expect(de.query(By.css('#ended')).nativeElement.textContent)
      .toContain("10:00 PM")
  }));

  it('should show input buttons with complete job', async(() => {
    testComponent.job = completeJob;
    fixture.detectChanges();
    expect(testComponent.jobPanelsComponent.showInputsButton()).toBeTruthy();
    expect(testComponent.jobPanelsComponent.showOutputsButton()).toBeTruthy();
    expect(fixture.debugElement.queryAll(By.css('.view-resources-button')).length)
      .toEqual(2);
  }));

  it('GCS resource urls should return correct values', async(() => {
    testComponent.job = completeJob;
    fixture.detectChanges();
    expect(testComponent.jobPanelsComponent.getInputResourceURL('input'))
      .toEqual('https://console.cloud.google.com/storage/browser/input/url');
    expect(testComponent.jobPanelsComponent.getOutputResourceURL('output'))
      .toEqual('https://console.cloud.google.com/storage/browser/output/url');
  }));

  it('invalid resource url should return invalid', async(() => {
    expect(testComponent.jobPanelsComponent.getResourceURL('/invalid/url'))
      .toBeUndefined();
  }));

  it('getUserId should return correct value', async(() => {
    testComponent.job = completeJob;
    fixture.detectChanges();
    expect(testComponent.jobPanelsComponent.getUserId(testComponent.job))
      .toEqual('user-1');
  }));

  it('should calculate job duration', async(() => {
    testComponent.job = completeJob;
    fixture.detectChanges();
    expect(testComponent.jobPanelsComponent.getDuration()).toEqual("2h 30m");
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
