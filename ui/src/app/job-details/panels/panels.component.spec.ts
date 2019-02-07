import {TestBed, async, ComponentFixture} from '@angular/core/testing';
import {By} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {Component, DebugElement, ViewChild} from '@angular/core';
import {
  MatButtonModule,
  MatCardModule,
  MatGridListModule,
  MatMenuModule,
  MatTabsModule,
  MatTableModule
} from '@angular/material';
import {ClrIconModule, ClrTooltipModule} from '@clr/angular';
import {SharedModule} from '../../shared/shared.module';
import {JobStatus} from '../../shared/model/JobStatus';
import {JobMetadataResponse} from '../../shared/model/JobMetadataResponse';
import {JobPanelsComponent} from './panels.component';
import {JobFailuresTableComponent} from "../common/failures-table/failures-table.component";

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
      labels: {'label1': 'test-label1', 'label2': 'test-label2'},
      extensions: {
        userId: 'test-user',
        statusDetail: 'success',
      }
    };

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        JobFailuresTableComponent,
        JobPanelsComponent,
        TestPanelsComponent
      ],
      imports: [
        BrowserAnimationsModule,
        ClrIconModule,
        ClrTooltipModule,
        MatButtonModule,
        MatCardModule,
        MatGridListModule,
        MatMenuModule,
        MatTabsModule,
        MatTableModule,
        SharedModule
      ],
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
    expect(de.queryAll(By.css('.card')).length).toEqual(1);
    expect(de.query(By.css('.header')).nativeElement.textContent).toEqual('');
    expect(de.query(By.css('.job-id')).nativeElement.textContent)
      .toContain(minimalJob.id);
  }));

  it('should display all features with complete job', async(() => {
    testComponent.job = completeJob;
    fixture.detectChanges();
    let de: DebugElement = fixture.debugElement;
    let labels = de.queryAll(By.css('.label'));
    let detailFields = de.queryAll(By.css('.detail-field'));
    expect(labels.length).toEqual(2);
    expect(labels[0].nativeElement.textContent).toContain(completeJob.labels['label1']);
    expect(labels[1].nativeElement.textContent).toContain(completeJob.labels['label2']);
    expect(detailFields.length).toEqual(2);
    expect(detailFields[0].nativeElement.textContent).toContain(completeJob.extensions['userId']);
    expect(detailFields[1].nativeElement.textContent).toContain(completeJob.extensions['statusDetail']);
    expect(de.query(By.css('#ended')).nativeElement.textContent)
      .toContain("Mar 29, 1994");
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
