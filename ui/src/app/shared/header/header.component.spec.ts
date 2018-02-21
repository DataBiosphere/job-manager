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

import {CapabilitiesService} from "../../core/capabilities.service"
import {MockCapabilitiesService} from "../../testing/mock-capabilities.service"
import {JobListView} from "../job-stream";
import {HeaderComponent} from "./header.component";
import {CapabilitiesResponse} from '../model/CapabilitiesResponse';
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
  let capabilities: CapabilitiesResponse = 
    {
      displayFields: [
        {field: 'status', display: 'Status'},
        {field: 'submission', display: 'Submitted'},
        {field: 'extensions.userId', display: 'User ID'},
        {field: 'labels.job-id', display: 'Job ID'}
      ],
      queryExtensions: ['projectId']
    };

  beforeEach(async(() => {

    TestBed.configureTestingModule({
      declarations: [HeaderComponent, TestHeaderComponent, JoblessTestHeaderComponent],
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
          {path: '', component: TestHeaderComponent},
          {path: 'jobs', component: TestHeaderComponent}
        ]),
      ],
      providers: [
        {provide: CapabilitiesService, useValue: new MockCapabilitiesService(capabilities)}
      ]
    }).compileComponents();
  }));

  beforeEach(async(() => {
    fixture = TestBed.createComponent(TestHeaderComponent);
    testComponent = fixture.componentInstance.headerComponent;
    testComponent.chips = new Map()
      .set('projectId', 'Project ID')
      .set('name', 'Job Name')
      .set('statuses', 'Running');
    fixture.detectChanges();
  }));

  it('should display a chip for each query filter', async(() => {
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
    testComponent.addChip('start');
    testComponent.setCurrentChip('start');
    testComponent.assignDateValue(new Date("11/11/2011"));
    fixture.detectChanges();
    expect(testComponent.chips.get('start')).toEqual('11/11/2011');
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
    testComponent.chips.set('statuses', 'list,of,statuses');
    testComponent.search();
    fixture.detectChanges();
    fixture.whenStable().then(() => {
      fixture.detectChanges();
      expect(fixture.debugElement.queryAll(By.css('.status-button')).length).toEqual(0);
    });
  }));

  it('should show status buttons', async(() => {
    testComponent.chips.delete('statuses');
    testComponent.search();
    fixture.detectChanges();
    fixture.whenStable().then(() => {
      fixture.detectChanges();
      expect(fixture.debugElement.queryAll(By.css('.status-button')).length).toEqual(3);
    });
  }));

  it('should change statuses', async(() => {
    testComponent.changeStatus(JobStatus.Running, false);
    testComponent.changeStatus(JobStatus.Aborted, true);
    testComponent.changeStatus(JobStatus.Aborting, true);
    fixture.detectChanges();
    expect(fixture.debugElement.queryAll(By.css('#chip')).length).toEqual(3);
    expect(testComponent.selectedStatuses.length).toEqual(2);
  }));

  it('should only show length for exhaustive job streams', async(() => {
    testComponent.jobs.next({
      results: [testJob1],
      exhaustive: false
    });
    fixture.detectChanges();
    let de: DebugElement = fixture.debugElement;
    expect(de.query(By.css('.mat-paginator-range-label')).nativeElement.textContent)
      .toContain('of many');

    // Transition to exhaustive, "of X" should now display length.
    testComponent.jobs.next({
      results: [testJob1, testJob2],
      exhaustive: true
    });
    fixture.detectChanges();
    expect(de.query(By.css('.mat-paginator-range-label')).nativeElement.textContent)
      .toContain('of 2');
  }));

  it('should render properly on non-table views', async(() => {
    fixture = TestBed.createComponent(JoblessTestHeaderComponent);
    testComponent = fixture.componentInstance.headerComponent;
    testComponent.chips = new Map().set('parent-id', 'Parent ID');
    fixture.detectChanges();

    // e.g. on the details page, should not see status tabs or pagination controls
    expect(fixture.debugElement.queryAll(By.css('.status-button')).length).toEqual(0);
    expect(fixture.debugElement.queryAll(By.css('.mat-paginator')).length).toEqual(0);
  }));

  @Component({
    selector: 'jm-test-table-component',
    template:
      `<jm-header [showControls]="true" [jobs]="jobs" [pageSize]="25"></jm-header>`
  })
  class TestHeaderComponent {
    public jobs = new BehaviorSubject<JobListView>(initJobs);
    @ViewChild(HeaderComponent)
    public headerComponent: HeaderComponent;
  }

  @Component({
    selector: 'jm-test-table-component',
    template: `<jm-header [showControls]="false"></jm-header>`
  })
  class JoblessTestHeaderComponent extends TestHeaderComponent {
    public jobs = null;
  }
});
