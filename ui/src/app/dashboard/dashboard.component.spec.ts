import {async, ComponentFixture, TestBed, fakeAsync, tick} from '@angular/core/testing';
import {By} from '@angular/platform-browser';
import {CommonModule} from '@angular/common';
import {Component, DebugElement} from '@angular/core';
import {
  MatButtonModule,
  MatCardModule,
  MatSelectModule,
  MatSortModule,
  MatTableModule
} from '@angular/material';
import {RouterTestingModule} from '@angular/router/testing';
import {ActivatedRoute, Router} from "@angular/router";

import {JobManagerService} from '../core/job-manager.service';
import {SharedModule} from '../shared/shared.module';
import {RouteReuse} from '../route-reuse.service';
import {DashboardResolver} from "./dashboard.resolver.service";
import {DashboardComponent} from "./dashboard.component";
import {TotalSummaryComponent} from "./total-summary/total-summary.component";
import {GroupedSummaryComponent} from "./grouped-summary/grouped-summary.component";
import {FakeAggregationService} from "../testing/fake-aggregation.service";
import {URLSearchParamsUtils} from "../shared/utils/url-search-params.utils";
import {JobStatus} from "../shared/model/JobStatus";
import {AggregationResponse} from "../shared/model/AggregationResponse";
import {CapabilitiesResponse} from "../shared/model/CapabilitiesResponse";
import {CapabilitiesService} from "../core/capabilities.service";
import {FakeCapabilitiesService} from "../testing/fake-capabilities.service";
import {BrowserAnimationsModule} from "@angular/platform-browser/animations";
import {ClrIconModule, ClrTooltipModule} from "@clr/angular";
import {SettingsService} from "../core/settings.service";
import {AuthService} from "../core/auth.service";

const TEST_AGGREGATION_RESPONSE: AggregationResponse =
  {
    aggregations: [
      {
        key: 'anotherLabel',
        name: 'AnotherLabel',
        entries: [
          {
            label: 'labelValue1',
            statusCounts: {
              counts: [
                {
                  count: 2,
                  status: JobStatus.Succeeded
                },
                {
                  count: 1,
                  status: JobStatus.Failed
                }
              ]
            }
          },
          {
            label: 'labelValue1',
            statusCounts: {
              counts: [
                {
                  count: 4,
                  status: JobStatus.Succeeded
                },
                {
                  count: 6,
                  status: JobStatus.Failed
                }
              ]
            }
          }
        ]
      },
      {
        key: 'userId',
        name: 'User',
        entries: [
          {
            label: 'user1',
            statusCounts: {
              counts: [
                {
                  count: 5,
                  status: JobStatus.Succeeded
                },
                {
                  count: 6,
                  status: JobStatus.Failed
                }
              ]
            }
          },
          {
            label: 'user2',
            statusCounts: {
              counts: [
                {
                  count: 8,
                  status: JobStatus.Succeeded
                },
                {
                  count: 11,
                  status: JobStatus.Failed
                }
              ]
            }
          }
        ],
      },

    ],
    summary: {
      counts: [
        {
          count: 10,
          status: JobStatus.Succeeded
        },
        {
          count: 3,
          status: JobStatus.Failed
        }
      ]
    }
  };

describe('DashboardComponent', () => {
  let fixture: ComponentFixture<AppComponent>;
  let fakeJobService: FakeAggregationService;
  let de: DebugElement;
  let fakeCapabilitiesService: FakeCapabilitiesService;
  let settingsService: SettingsService;
  let authService: AuthService;

  const TEST_PROJECT = 'test-project';

  beforeEach(async(() => {
    fakeJobService = new FakeAggregationService(TEST_AGGREGATION_RESPONSE);
    const capabilities : CapabilitiesResponse = {
      displayFields: [
        {field: 'status', display: 'Status'},
        {field: 'submission', display: 'Submitted'},
        {field: 'extensions.userId', display: 'User ID'},
      ]
    };
    fakeCapabilitiesService = new FakeCapabilitiesService(capabilities);
    authService = new AuthService(null, fakeCapabilitiesService, null);
    settingsService = new SettingsService(authService, fakeCapabilitiesService, localStorage);
    TestBed.configureTestingModule({
      declarations: [
        AppComponent,
        DashboardComponent,
        TotalSummaryComponent,
        GroupedSummaryComponent,
        TestJobListComponent,
      ],
      imports: [
        ClrIconModule,
        ClrTooltipModule,
        CommonModule,
        BrowserAnimationsModule,
        MatCardModule,
        MatTableModule,
        MatSortModule,
        MatButtonModule,
        MatSelectModule,
        RouterTestingModule.withRoutes([
          {path: 'dashboard', component: DashboardComponent, resolve: {aggregations: DashboardResolver}},
          {path: 'jobs', component: TestJobListComponent}
        ]),
        SharedModule,
      ],
      providers: [
        {provide: JobManagerService, useValue: fakeJobService},
        {provide: CapabilitiesService, useValue: fakeCapabilitiesService},
        {provide: SettingsService, useValue: settingsService},
        {provide: AuthService, useValue: authService},
        DashboardResolver,
        RouteReuse
      ],
    }).compileComponents();
  }));

  beforeEach(fakeAsync(() => {
    fixture = TestBed.createComponent(AppComponent);
    de = fixture.debugElement;
    const router: Router = TestBed.get(Router);
    router.initialNavigation();

    router.navigate(['dashboard'], {
      queryParams: {
        q: 'projectId='+ TEST_PROJECT
      }
    });

    tick();
    fixture.detectChanges();
    tick();
  }));

  it('should create dashboard', fakeAsync(() => {
    const testComponent = de.query(By.css('jm-dashboard')).componentInstance;
    fixture.detectChanges();
    tick();
    expect(testComponent).toBeTruthy();
  }));

  it('should create expected amount of cards', fakeAsync(() => {
    const summaryCardNum = de.queryAll(By.css('jm-total-summary mat-card')).length;
    const groupedCardNum = de.queryAll(By.css('jm-grouped-summary')).length;
    expect(summaryCardNum).toEqual(4);
    expect(groupedCardNum).toEqual(TEST_AGGREGATION_RESPONSE.aggregations.length);
  }));

  it('should navigate to job-list page (fake) when status counts are clicked', fakeAsync(() => {
    const countAnchor = de.query(By.css('jm-dashboard a')).nativeElement;
    countAnchor.click();
    fixture.detectChanges();
    tick();

    expect(de.query(By.css('div')).nativeElement.textContent).toEqual('fake job-list page');
  }));

  it('should have status as url param when totalSummaryComponent links are clicked', fakeAsync(() => {
    const totalSummaryAnchor = de.query(By.css('jm-total-summary mat-card.card a')).nativeElement;
    const status: JobStatus = JobStatus.Succeeded;

    totalSummaryAnchor.click();
    fixture.detectChanges();
    tick();
    const testJobListComponent = de.query(By.css('jm-test-job-list-component')).componentInstance;
    const queryJobRequest = URLSearchParamsUtils.unpackURLSearchParams(testJobListComponent.activatedRoute.snapshot.queryParams['q']);
    expect(queryJobRequest.status).toContain(status);
    expect(queryJobRequest.extensions['projectId']).toEqual(TEST_PROJECT);
  }));

  it('should have status and label as url params when groupedSummaryComponent links are clicked', fakeAsync(() => {
    const groupedSummaryAnchor = de.query(By.css('jm-grouped-summary tr td.count a')).nativeElement;
    const status: JobStatus = JobStatus.Succeeded;
    const labelKey = TEST_AGGREGATION_RESPONSE.aggregations[0].key;
    const labelValue = TEST_AGGREGATION_RESPONSE.aggregations[0].entries[0].label;

    groupedSummaryAnchor.click();
    tick();

    const testJobListComponent = de.query(By.css('jm-test-job-list-component')).componentInstance;
    const queryJobRequest = URLSearchParamsUtils.unpackURLSearchParams(testJobListComponent.activatedRoute.snapshot.queryParams['q']);
    // this test is based on the hard-coded aggregation response
    expect(queryJobRequest.status).toContain(status);
    expect(queryJobRequest.labels[labelKey]).toEqual(labelValue);
    expect(queryJobRequest.extensions['projectId']).toEqual(TEST_PROJECT);
  }));

  @Component({
    selector: 'jm-test-app',
    template: '<router-outlet></router-outlet>'
  })
  class AppComponent {}

  @Component({
    selector: 'jm-test-job-list-component',
    template: '<div>fake job-list page</div>'
  })
  class TestJobListComponent {
      constructor(public activatedRoute : ActivatedRoute) {}
  }
});
