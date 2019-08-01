import {async, ComponentFixture, TestBed, fakeAsync, tick} from '@angular/core/testing';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {By} from '@angular/platform-browser';
import {CommonModule} from '@angular/common';
import {Component, DebugElement} from '@angular/core';
import {
  MatButtonModule,
  MatCardModule,
  MatDialogModule,
  MatDividerModule,
  MatExpansionModule,
  MatIconModule,
  MatListModule,
  MatMenuModule,
  MatSnackBar,
  MatTableModule,
  MatTabsModule,
  MatTooltipModule,
} from '@angular/material';
import {RouterTestingModule} from '@angular/router/testing';
import {ClrIconModule, ClrTooltipModule} from '@clr/angular';
import {Ng2GoogleChartsModule} from 'ng2-google-charts';

import {JobDebugIconsComponent} from "./common/debug-icons/debug-icons.component";
import {JobDetailsComponent} from "./job-details.component"
import {JobPanelsComponent} from './panels/panels.component';
import {JobResourcesComponent} from './resources/resources.component';
import {JobResourcesTableComponent} from './resources/resources-table/resources-table.component';
import {JobTabsComponent} from "./tabs/tabs.component";
import {JobManagerService} from '../core/job-manager.service';
import {JobDetailsResolver} from './job-details-resolver.service';
import {FakeJobManagerService} from '../testing/fake-job-manager.service';
import {SharedModule} from '../shared/shared.module';
import {ActivatedRoute, Router} from '@angular/router';
import {URLSearchParamsUtils} from '../shared/utils/url-search-params.utils';
import {JobStatus} from "../shared/model/JobStatus";
import {JobMetadataResponse} from '../shared/model/JobMetadataResponse';
import {JobFailuresTableComponent} from "./common/failures-table/failures-table.component";
import {JobTimingDiagramComponent} from "./tabs/timing-diagram/timing-diagram.component";
import {JobScatteredAttemptsComponent} from "./tabs/scattered-attempts/scattered-attempts.component";
import {JobAttemptComponent} from "./common/attempt/attempt.component";
import {FakeCapabilitiesService} from "../testing/fake-capabilities.service";
import {SettingsService} from "../core/settings.service";
import {AuthService} from "../core/auth.service";
import {CapabilitiesService} from "../core/capabilities.service";

describe('JobDetailsComponent', () => {

  let testComponent: JobDetailsComponent;
  let fixture: ComponentFixture<TestJobDetailsComponent>;
  let router: Router;
  let fakeJobService: FakeJobManagerService;

  const jobId = '123';
  function testJob(): JobMetadataResponse {
    return {
      id: jobId,
      name: 'job-name',
      status: JobStatus.Running,
      submission: new Date('2015-04-20T20:00:00'),
      extensions: {userId: 'test-user-id'}
    };
  }

  beforeEach(async(() => {
    fakeJobService = new FakeJobManagerService([testJob()]);
    let fakeCapabilitiesService: FakeCapabilitiesService = new FakeCapabilitiesService({});
    let authService = new AuthService(null, fakeCapabilitiesService, null, null);
    let settingsService: SettingsService = new SettingsService(authService, fakeCapabilitiesService, localStorage);

    TestBed.configureTestingModule({
      declarations: [
        AppComponent,
        FakeJobListComponent,
        TestJobDetailsComponent,
        JobAttemptComponent,
        JobDebugIconsComponent,
        JobDetailsComponent,
        JobFailuresTableComponent,
        JobPanelsComponent,
        JobResourcesComponent,
        JobResourcesTableComponent,
        JobTabsComponent,
        JobTimingDiagramComponent,
        JobScatteredAttemptsComponent,
      ],
      imports: [
        ClrIconModule,
        ClrTooltipModule,
        CommonModule,
        MatButtonModule,
        MatCardModule,
        MatDialogModule,
        MatDividerModule,
        MatExpansionModule,
        MatIconModule,
        MatListModule,
        MatMenuModule,
        MatTableModule,
        MatTabsModule,
        MatTooltipModule,
        SharedModule,
        BrowserAnimationsModule,
        Ng2GoogleChartsModule,
        RouterTestingModule.withRoutes([
          {
            path: 'jobs/:id',
            component: TestJobDetailsComponent,
            resolve: {job: JobDetailsResolver}
          },
          {path: 'jobs', component: FakeJobListComponent}
        ]),
      ],
      providers: [
        {provide: JobManagerService, useValue: fakeJobService},
        {provide: SettingsService, useValue: settingsService},
        {provide: CapabilitiesService, useValue: fakeCapabilitiesService},
        {provide: AuthService, useValue: authService},
        {provide: MatSnackBar},
        JobDetailsResolver
      ],
    }).compileComponents();
  }));

  beforeEach(fakeAsync(() => {
    fixture = TestBed.createComponent(AppComponent);
    router = TestBed.get(Router);

    router.initialNavigation();
    router.navigate(['jobs/' + jobId]);
    tick();

    fixture.detectChanges();
    tick();

    testComponent = fixture.debugElement.query(By.css('jm-job-details')).componentInstance;
  }));

  it('renders details', fakeAsync(() => {
    const de: DebugElement = fixture.debugElement;
    expect(de.query(By.css('#job-id')).nativeElement.value).toContain(jobId);
  }));

  it('navigates to jobs table on close', fakeAsync(() => {
    const q = URLSearchParamsUtils.encodeURLSearchParams({
      'extensions': {'projectId': 'foo'}
    })
    router.navigate(['jobs/' + jobId], {queryParams: {q}});
    tick();

    fixture.detectChanges();
    tick();

    const de: DebugElement = fixture.debugElement;
    de.query(By.css('.close')).nativeElement.click();
    fixture.detectChanges();
    tick();

    const fakeJobs = fixture.debugElement.query(By.css('.fake-jobs'));
    expect(fakeJobs).toBeTruthy();
    const fakeJobsRoute = fakeJobs.componentInstance.route;
    expect(fakeJobsRoute.snapshot.queryParams['q']).toEqual(q);
  }));

  @Component({
    selector: 'jm-test-app',
    template: '<router-outlet></router-outlet>'
  })
  class AppComponent {}

  @Component({
    selector: 'jm-test-job-details-component',
    template: '<jm-job-details></jm-job-details>'
  })
  class TestJobDetailsComponent {}

  @Component({
    selector: 'jm-fake-job-list-component',
    template: '<div class="fake-jobs"></div>'
  })
  class FakeJobListComponent {
    constructor(public route: ActivatedRoute) {}
  }
});
