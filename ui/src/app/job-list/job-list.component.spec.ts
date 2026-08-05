import {ComponentFixture, TestBed, fakeAsync, tick, waitForAsync} from '@angular/core/testing';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {By} from '@angular/platform-browser';
import {CommonModule} from '@angular/common';
import {Component, DebugElement} from '@angular/core';
import {MatButtonModule} from "@angular/material/button";
import {MatCardModule} from "@angular/material/card";
import {MatCheckboxModule} from "@angular/material/checkbox";
import {MatDialogModule} from "@angular/material/dialog";
import {MatDividerModule} from '@angular/material/divider';
import {MatListModule} from "@angular/material/list";
import {MatMenuModule} from "@angular/material/menu";
import {MatPaginatorModule} from "@angular/material/paginator";
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {MatSelectModule} from "@angular/material/select";
import {MatSlideToggleModule} from "@angular/material/slide-toggle";
import {MatSnackBar, MatSnackBarModule} from "@angular/material/snack-bar";
import {MatSortModule} from "@angular/material/sort";
import {MatTableModule} from "@angular/material/table";
import {MatTooltipModule} from "@angular/material/tooltip";
import {RouterTestingModule} from '@angular/router/testing';

import {CapabilitiesService} from '../core/capabilities.service';
import {JobListComponent} from "./job-list.component"
import {JobsBulkEditComponent} from "./table/bulk-edit/bulk-edit.component";
import {JobsTableComponent} from "./table/table.component"
import {JobManagerService} from '../core/job-manager.service';
import {JobListResolver} from './job-list-resolver.service';
import {FakeJobManagerService} from '../testing/fake-job-manager.service';
import {FakeCapabilitiesService} from '../testing/fake-capabilities.service';
import {SharedModule} from '../shared/shared.module';
import {Router} from "@angular/router";
import {CapabilitiesResponse} from '../shared/model/CapabilitiesResponse';
import {QueryJobsResult} from '../shared/model/QueryJobsResult';
import {JobStatus} from '../shared/model/JobStatus';
import {RouteReuse} from '../route-reuse.service';
import {SettingsService} from "../core/settings.service";
import {AuthService} from "../core/auth.service";

describe('JobListComponent', () => {

  // Jobs with IDs JOB0 -> JOB4.
  function testJobs(count: number): QueryJobsResult[] {
    const base = {
      status: JobStatus.Running,
      submission: new Date('2015-04-20T20:00:00'),
      start: new Date('2015-04-20T20:00:01'),
      end: new Date('2015-04-20T20:01:00'),
      extensions: {userId: 'test-user-id'}
    };
    return (new Array(count)).fill(null).map((_, i) => {
      return {
        ...base,
        id: `JOB${i}`,
        name: `JOB ${i}`
      };
    });
  }

  let testComponent: JobListComponent;
  let fixture: ComponentFixture<TestJobListComponent>;
  let fakeJobService: FakeJobManagerService;
  let capabilities: CapabilitiesResponse;
  let fakeCapabilitiesService: FakeCapabilitiesService;
  let settingsService: SettingsService;
  let authService: AuthService;
  let snackBar: MatSnackBar;

  beforeEach(waitForAsync(() => {
    fakeJobService = new FakeJobManagerService(testJobs(5));
    capabilities = {
      displayFields: [
        {field: 'name', display: 'Name', primary: true},
        {field: 'status', display: 'Status', primary: true},
        {field: 'submission', display: 'Submitted', primary: true},
        {field: 'extensions.userId', display: 'User ID', primary: true}
      ]
    };
    fakeCapabilitiesService = new FakeCapabilitiesService(capabilities);
    authService = new AuthService(null, fakeCapabilitiesService, null, snackBar, null, null);
    settingsService = new SettingsService(authService, fakeCapabilitiesService, localStorage);
    TestBed.configureTestingModule({
      declarations: [
        AppComponent,
        FakeProjectsComponent,
        JobsBulkEditComponent,
        JobListComponent,
        TestJobListComponent,
        JobsTableComponent
      ],
      imports: [
        BrowserAnimationsModule,
        CommonModule,
        MatButtonModule,
        MatCardModule,
        MatCheckboxModule,
        MatDialogModule,
        MatDividerModule,
        MatListModule,
        MatSlideToggleModule,
        MatMenuModule,
        MatPaginatorModule,
        MatProgressSpinnerModule,
        MatSnackBarModule,
        MatSelectModule,
        MatSortModule,
        MatTableModule,
        MatTooltipModule,
        RouterTestingModule.withRoutes([
          {path: 'jobs', component: TestJobListComponent, resolve: {stream: JobListResolver}},
          {path: 'projects', component: FakeProjectsComponent}
        ]),
        SharedModule
      ],
      providers: [
        {provide: JobManagerService, useValue: fakeJobService},
        {provide: SettingsService, useValue: settingsService},
        {provide: CapabilitiesService, useValue: fakeCapabilitiesService},
        {provide: AuthService, useValue: authService},
        JobListResolver,
        RouteReuse
      ],
    }).compileComponents();
  }));

  beforeEach(fakeAsync(() => {
    fixture = TestBed.createComponent(AppComponent);

    const router: Router = TestBed.inject(Router);
    router.initialNavigation();
    router.navigate(['jobs']);
    tick();

    fixture.detectChanges();
    tick();

    testComponent = fixture.debugElement.query(By.css('jm-job-list')).componentInstance;
  }));

  function expectJobsRendered(jobs: QueryJobsResult[]) {
    const de: DebugElement = fixture.debugElement;
    const rows = de.queryAll(By.css('.mat-row'));
    expect(rows.length).toEqual(jobs.length);
    rows.forEach((row, i) => {
      expect(row.nativeElement.textContent).toContain(jobs[i].name);
    });
  }

  it('displays error message bar', waitForAsync(() => {
    let error = {
      status: 400,
      title: 'Bad Request',
      message: 'Missing required field `parentId`'
    };
    testComponent.handleError(error);
    fixture.detectChanges();

    let de: DebugElement = fixture.debugElement;
    expect(de.query(By.css('.mat-mdc-simple-snack-bar, .mat-simple-snackbar')).nativeElement.textContent.replace(/\s+/g, ' ').trim())
      .toEqual("Bad Request (400): Missing required field `parentId` Dismiss");
  }));

  // Note: Unfortunately many of the following fakeAsync() usages require
  // gratuitous use of tick(). This is because a subcomponent of the paginator
  // is setting a timeout on render.
  it('renders job rows', fakeAsync(() => {
    fixture.detectChanges();
    tick();
    expectJobsRendered(fakeJobService.jobs.slice(0, 3));
  }));

  it('renders the loading spinner only during load', fakeAsync(() => {
    let de: DebugElement = fixture.debugElement;
    expect(de.queryAll(By.css('.spinner-container')).length).toEqual(0);

    // Ideally we'd click a nav element here instead, but unfortunately the
    // navigate and job load would be evaluated within a single tick(), so we'd
    // never see the loading spinner.
    testComponent.reloadJobs('');
    fixture.detectChanges();
    expect(de.queryAll(By.css('.spinner-container')).length).toEqual(1);
    tick();

    // We don't finish loading until we complete a query that matches the
    // the ActiveRoute; so trigger a real navigate to clear the loading state.
    de.query(By.css('.running-button')).nativeElement.click();
    tick();
    fixture.detectChanges();
    expect(de.queryAll(By.css('.spinner-container')).length).toEqual(0);
  }));

  it('paginates forward', fakeAsync(() => {
    fakeJobService.jobs = testJobs(5);
    tick();
    fixture.detectChanges();
    tick();
    const de: DebugElement = fixture.debugElement;
    de.query(By.css('button[aria-label="Next page"]')).nativeElement.click();
    fixture.detectChanges();
    tick();
    fixture.detectChanges(); // Allow paginator to update its state
    // Page 2.
    expectJobsRendered(fakeJobService.jobs.slice(3, 5));

    // Verify we're on the last page by checking button classes or aria-disabled
    const prevButton = de.query(By.css('button[aria-label="Previous page"]'));
    const nextButton = de.query(By.css('button[aria-label="Next page"]'));

    // Previous button should be enabled (not have disabled class)
    expect(prevButton.nativeElement.classList.contains('mat-mdc-button-disabled') ||
           prevButton.nativeElement.getAttribute('aria-disabled') === 'true').toBeFalsy();
    // Next button should be disabled (we're on last page)
    expect(nextButton.nativeElement.classList.contains('mat-mdc-button-disabled') ||
           nextButton.nativeElement.getAttribute('aria-disabled') === 'true' ||
           nextButton.nativeElement.disabled).toBeTruthy();
  }));

  it('paginates backwards', fakeAsync(() => {
    fakeJobService.jobs = testJobs(5);
    tick();
    fixture.detectChanges();
    const de: DebugElement = fixture.debugElement;
    de.query(By.css('button[aria-label="Next page"]')).nativeElement.click();
    fixture.detectChanges();

    // Back to page 1, which should have the first 3 jobs.
    de.query(By.css('button[aria-label="Previous page"]')).nativeElement.click();
    fixture.detectChanges();
    tick();
    fixture.detectChanges(); // Allow paginator to update its state
    expectJobsRendered(fakeJobService.jobs.slice(0, 3));

    // Verify we're on the first page
    const prevButton = de.query(By.css('button[aria-label="Previous page"]'));
    const nextButton = de.query(By.css('button[aria-label="Next page"]'));

    // Previous button should be disabled (we're on first page)
    expect(prevButton.nativeElement.classList.contains('mat-mdc-button-disabled') ||
           prevButton.nativeElement.getAttribute('aria-disabled') === 'true' ||
           prevButton.nativeElement.disabled).toBeTruthy();
    // Next button should be enabled
    expect(nextButton.nativeElement.classList.contains('mat-mdc-button-disabled') ||
           nextButton.nativeElement.getAttribute('aria-disabled') === 'true').toBeFalsy();
  }));

  it('next pagination is disabled on last page when number of jobs equals the page length', fakeAsync(() => {
    fakeJobService.jobs = testJobs(6);
    testComponent.jobStream.setStale();
    fixture.detectChanges();
    tick(100);

    const de: DebugElement = fixture.debugElement;
    de.query(By.css('button[aria-label="Next page"]')).nativeElement.click();
    fixture.detectChanges();
    tick(); // Allow async operations
    fixture.detectChanges(); // Allow paginator to update its state

    // the last three jobs should be displayed and next page button should be disabled
    expectJobsRendered(fakeJobService.jobs.slice(3, 6));
    const nextButton = de.query(By.css('button[aria-label="Next page"]'));
    expect(nextButton.nativeElement.classList.contains('mat-mdc-button-disabled') ||
           nextButton.nativeElement.getAttribute('aria-disabled') === 'true' ||
           nextButton.nativeElement.disabled).toBeTruthy();
  }));

  it('reloads properly on filter', fakeAsync(() => {
    const jobs: QueryJobsResult[] = testJobs(5);
    jobs[1].status = JobStatus.Succeeded;
    jobs[3].status = JobStatus.Aborted;
    fakeJobService.jobs = jobs;
    tick();
    fixture.detectChanges();

    let de: DebugElement = fixture.debugElement;
    de.query(By.css('.succeeded-button')).nativeElement.click();
    tick();
    fixture.detectChanges();
    tick();
    expectJobsRendered([jobs[1]]);
  }));

  it('reloads properly on abort', waitForAsync(() => {
    const jobs = testJobs(5);
    fakeJobService.jobs = jobs;
    fixture.detectChanges();

    // Filter by active to filter out jobs after they've been aborted.
    let de: DebugElement = fixture.debugElement;
    de.query(By.css('.running-button')).nativeElement.click();
    fixture.detectChanges();

    // We select the first page (3 jobs) and abort. Jobs 3 and 4 are unaffected.
    let component = de.query(By.css('jm-job-list-table')).componentInstance;
    component.toggleSelectAll();
    fixture.detectChanges();

    // fakeAsync() doesn't play well with the Promises used on abort.
    de.query(By.css('.group-abort')).nativeElement.click();
    fixture.whenStable().then(() => {
      fixture.detectChanges();

      // Jobs 3 and 4 should be the only jobs displayed, as they are the only
      // remaining active jobs.
      expectJobsRendered(jobs.slice(3, 5));
    });
  }));

  it('reloads properly with stale data', fakeAsync(() => {
    tick();
    fixture.detectChanges();

    const freshJobs = testJobs(10);
    freshJobs[0].name = "updated";
    freshJobs[1].name = "new";
    fakeJobService.jobs = freshJobs;
    testComponent.jobStream.setStale();

    fixture.detectChanges();
    tick(1000);

    fixture.whenStable().then(() => {
      fixture.detectChanges();
      expectJobsRendered(freshJobs.slice(0, 3));
    });
  }));

  it('pagination resets on filter', fakeAsync(() => {
    const jobs = testJobs(5);
    jobs[3].status = JobStatus.Failed;
    fakeJobService.jobs = jobs;
    tick();
    fixture.detectChanges();

    const de: DebugElement = fixture.debugElement;
    de.query(By.css('button[aria-label="Next page"]')).nativeElement.click();
    fixture.detectChanges();

    de.query(By.css('.failed-button')).nativeElement.click();
    tick();
    fixture.detectChanges();
    tick();
    expectJobsRendered([jobs[3]]);
  }));

  it('navigates on missing project when projects supported', fakeAsync(() => {
    capabilities.queryExtensions = ['projectId'];
    testComponent.reloadJobs('');

    fixture.detectChanges();
    tick();

    const de: DebugElement = fixture.debugElement;
    expect(de.queryAll(By.css('.fake-projects')).length).toEqual(1);
  }));

  it('does not display the hide archived setting without the right project setting', waitForAsync(() => {
    testComponent.settingsService.setSavedSettingValue('hideArchived', null, testComponent.projectId);
    fixture.detectChanges();
    const de: DebugElement = fixture.debugElement;

    de.query(By.css('button.settings-icon')).nativeElement.click();
    fixture.detectChanges();

    expect(de.queryAll(By.css('.settings-menu .mat-slide-toggle.hide-archived')).length).toEqual(0);
  }));

  it('displays the hide archived setting when the project setting is set', fakeAsync(() => {
    tick();
    testComponent.settingsService.setSavedSettingValue('hideArchived', true, testComponent.projectId);
    fixture.detectChanges();
    const de: DebugElement = fixture.debugElement;
    de.query(By.css('.settings-icon')).nativeElement.click();
    fixture.detectChanges();
    expect(de.queryAll(By.css('.settings-menu .hide-archived')).length).toEqual(1);
  }));

  @Component({
    selector: 'jm-test-app',
    template: '<router-outlet></router-outlet>',
    standalone: false
})
  class AppComponent {}

  @Component({
    selector: 'jm-test-job-list-component',
    template: '<jm-job-list [pageSize]="3"></jm-job-list>',
    standalone: false
})
  class TestJobListComponent {}

  @Component({
    selector: 'jm-fake-projects-component',
    template: '<div class="fake-projects"></div>',
    standalone: false
})
  class FakeProjectsComponent {}
});
