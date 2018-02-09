import {async, ComponentFixture, TestBed} from "@angular/core/testing";
import {By} from "@angular/platform-browser";
import {Component, DebugElement, ViewChild} from "@angular/core";
import {
  MatAutocompleteModule,
  MatButtonModule,
  MatCheckboxModule,
  MatChipsModule,
  MatDatepickerModule,
  MatIconModule,
  MatInputModule,
  MatListModule,
  MatMenuModule,
  MatNativeDateModule,
  MatPaginatorModule,
} from "@angular/material";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {RouterTestingModule} from "@angular/router/testing";
import {BrowserAnimationsModule} from "@angular/platform-browser/animations";
import {BehaviorSubject} from 'rxjs/BehaviorSubject';

import {JobListView} from "../job-stream";
import {HeaderComponent} from "./header.component";
import {startCol, statusesCol} from "../common";
import {QueryJobsResult} from '../model/QueryJobsResult';
import {JobStatus} from "../model/JobStatus";


describe('HeaderComponent', () => {
  const baseJob = {
    status: JobStatus.Running,
    submission: new Date('2015-04-20T20:00:00'),
  }
  const testJob1: QueryJobsResult = { ...baseJob, id: 'JOB1' };
  const testJob2: QueryJobsResult = { ...baseJob, id: 'JOB2' };
  const testJob3: QueryJobsResult = { ...baseJob, id: 'JOB3' };

  const initJobs = {
    results: [testJob1, testJob2, testJob3],
    exhaustive: false
  }

  let testComponent: HeaderComponent;
  let fixture: ComponentFixture<TestHeaderComponent>;

  beforeEach(async(() => {

    TestBed.configureTestingModule({
      declarations: [HeaderComponent, TestHeaderComponent],
      imports: [
        BrowserAnimationsModule,
        FormsModule,
        MatAutocompleteModule,
        MatButtonModule,
        MatCheckboxModule,
        MatChipsModule,
        MatDatepickerModule,
        MatIconModule,
        MatInputModule,
        MatListModule,
        MatMenuModule,
        MatNativeDateModule,
        MatPaginatorModule,
        ReactiveFormsModule,
        RouterTestingModule.withRoutes([
          {path: '', component: TestHeaderComponent}
        ]),
      ]
    }).compileComponents();
  }));

  beforeEach(async(() => {
    fixture = TestBed.createComponent(TestHeaderComponent);
    testComponent = fixture.componentInstance.headerComponent;
    testComponent.chips = new Map()
      .set('parent-id', 'Parent ID')
      .set('job-name', 'Job Name')
      .set('statuses', 'Running');
    fixture.detectChanges();
  }));

  it('should display a chip for each query filter', async(() => {
    fixture.detectChanges();
    let de: DebugElement = fixture.debugElement;
    expect(de.queryAll(By.css('#chip')).length).toEqual(3);
  }));

  it('should stage a chip', async ( () => {
    testComponent.addChip('key');
    fixture.detectChanges();
    expect(testComponent.chips.get('key')).toEqual('');
    expect(fixture.debugElement.queryAll(By.css('#chip')).length).toEqual(4);
  }));

  it('should stage and complete a free text chip', async (() => {
    testComponent.addChip('key');
    testComponent.setCurrentChip('key');
    testComponent.currentChipValue = 'value';
    testComponent.assignChipValue();
    fixture.detectChanges();
    expect(testComponent.chips.get('key')).toEqual('value');
    expect(fixture.debugElement.queryAll(By.css('#chip')).length).toEqual(4);
  }));

  it('should stage and complete a date chip', async (() => {
    testComponent.addChip(startCol);
    testComponent.setCurrentChip(startCol);
    testComponent.assignDateValue(new Date("11/11/2011"));
    fixture.detectChanges();
    expect(testComponent.chips.get(startCol)).toEqual('11/11/2011');
    expect(fixture.debugElement.queryAll(By.css('#chip')).length).toEqual(4);
  }));

  it('should replace existing chip', async (() => {
    testComponent.addChip('key');
    testComponent.setCurrentChip('key');
    testComponent.currentChipValue = 'value1';
    testComponent.assignChipValue();
    testComponent.addChip('key: value2');
    fixture.detectChanges();
    expect(testComponent.chips.get('key')).toEqual('value2');
    expect(fixture.debugElement.queryAll(By.css('#chip')).length).toEqual(4);
  }));

  it('should not show status buttons', async(() => {
    fixture.detectChanges();
    expect(fixture.debugElement.queryAll(By.css('.status-button')).length).toEqual(3);
  }));

  it('should show status buttons', async(() => {
    testComponent.chips.set('statuses', 'list,of,statuses');
    expect(fixture.debugElement.queryAll(By.css('.status-button')).length).toEqual(0);
  }));

  it('should change statuses', async(() => {
    testComponent.changeStatus(JobStatus.Running, false);
    testComponent.changeStatus(JobStatus.Aborted, true);
    testComponent.changeStatus(JobStatus.Aborting, true);
    fixture.detectChanges();
    expect(fixture.debugElement.queryAll(By.css('#chip')).length).toEqual(3);
    expect(testComponent.selectedStatuses.length).toEqual(2);
  }));

  @Component({
    selector: 'jm-test-table-component',
    template:
      `<jm-header [jobs]="jobs" [pageSize]="25"></jm-header>`
  })
  class TestHeaderComponent {
    public jobs = new BehaviorSubject<JobListView>(initJobs);
    @ViewChild(HeaderComponent)
    public headerComponent: HeaderComponent;
  }
});
