import {async, ComponentFixture, TestBed, fakeAsync, tick} from '@angular/core/testing';
import {By} from '@angular/platform-browser';
import {CommonModule} from '@angular/common';
import {Component} from '@angular/core';
import {MatCardModule, MatTableModule} from '@angular/material';
import {MatDividerModule} from '@angular/material/divider';
import {RouterTestingModule} from '@angular/router/testing';
import {ActivatedRoute, Router} from "@angular/router";
import 'rxjs/add/observable/of';

import {JobManagerService} from '../core/job-manager.service';
import {SharedModule} from '../shared/shared.module';
import {RouteReuse} from '../route-reuse.service';
import {DashboardResolver} from "./dashboard.resolver.service";
import {DashboardComponent} from "./dashboard.component";
import {TotalSummaryComponent} from "./total-summary/total-summary.component";
import {GroupedSummaryComponent} from "./grouped-summary/grouped-summary.component";
import {FakeAggregationService, CARD_NUM, TEST_AGGREGATION_RESPONSE} from "../testing/fake-aggregation.service";

describe('DashboardComponent', () => {
  let testComponent: DashboardComponent;
  let fixture: ComponentFixture<AppComponent>;
  let fakeJobService: FakeAggregationService;
  let testJobListComponent: TestJobListComponent;

  beforeEach(async(() => {
    fakeJobService = new FakeAggregationService();

    TestBed.configureTestingModule({
      declarations: [
        AppComponent,
        DashboardComponent,
        TotalSummaryComponent,
        GroupedSummaryComponent,
        TestJobListComponent,
      ],
      imports: [
        CommonModule,
        MatCardModule,
        MatDividerModule,
        MatTableModule,
        RouterTestingModule.withRoutes([
          {path: 'dashboard', component: DashboardComponent, resolve: {aggregations: DashboardResolver}},
          {path: 'jobs', component: TestJobListComponent}
        ]),
        SharedModule,
      ],
      providers: [
        {provide: JobManagerService, useValue: fakeJobService},
        DashboardResolver,
        RouteReuse
      ],
    }).compileComponents();
  }));

  beforeEach(fakeAsync(() => {
    fixture = TestBed.createComponent(AppComponent);
    const router: Router = TestBed.get(Router);
    router.initialNavigation();
    router.navigate(['dashboard']);
    tick();
    fixture.detectChanges();
    tick();
    testComponent = fixture.debugElement.query(By.css('jm-dashboard')).componentInstance;
  }));

  it('should create dashboard', fakeAsync(() => {
    fixture.detectChanges();
    tick();
    expect(testComponent).toBeTruthy();
  }));

  it("should create expected amount of cards", fakeAsync(() => {
    let matCards = fixture.debugElement.queryAll(By.css('mat-card'));
    expect(matCards.length).toEqual(CARD_NUM);
  }));

  it('should navigate to job-list page (fake) when status counts are clicked', fakeAsync(() => {
    let countAnchor = fixture.debugElement.query(By.css("jm-dashboard a")).nativeElement;
    countAnchor.click();
    fixture.detectChanges();
    tick();
    expect(fixture.debugElement.query(By.css("div")).nativeElement.textContent).toEqual("fake job-list page");
  }));

  it('should has status as url param when totalSummaryComponent links are clicked', fakeAsync(() => {
    let totalSummaryAnchor = fixture.debugElement.query(By.css("jm-total-summary .count a")).nativeElement;
    let status = fixture.debugElement.query(By.css("jm-total-summary .status")).nativeElement.textContent.trim();

    totalSummaryAnchor.click();
    fixture.detectChanges();
    tick();
    testJobListComponent = fixture.debugElement.query(By.css("jm-test-job-list-component")).componentInstance;
    expect(testJobListComponent.route.snapshot.queryParams['q'].indexOf(status)).toBeGreaterThan(-1);
  }));

  it("should has status and label as url params when groupedSummaryComponent links are clicked", fakeAsync(() => {
    let groupedSummaryAnchor = fixture.debugElement.query(By.css("jm-grouped-summary tr td.count a")).nativeElement;
    groupedSummaryAnchor.click();
    tick();
    testJobListComponent = fixture.debugElement.query(By.css("jm-test-job-list-component")).componentInstance;
    let q = testJobListComponent.route.snapshot.queryParams['q'];
    // this test is based on the hard-coded aggregation response
    expect(q.indexOf(TEST_AGGREGATION_RESPONSE.aggregations[0].key)).toBeGreaterThan(-1);
    expect(q.indexOf(TEST_AGGREGATION_RESPONSE.aggregations[0].entries[0].statusCounts.counts[0].status)).toBeGreaterThan(-1);
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
    public route: ActivatedRoute;
      constructor(activatedRoute : ActivatedRoute) {
        this.route = activatedRoute;
      }
  }
});
