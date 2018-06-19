import {async, ComponentFixture, TestBed, fakeAsync, tick} from '@angular/core/testing';
import {By} from '@angular/platform-browser';
import {CommonModule} from '@angular/common';
import {Component} from '@angular/core';
import {
  MatCardModule, MatTableModule
} from '@angular/material';
import {MatDividerModule} from '@angular/material/divider';
import {RouterTestingModule} from '@angular/router/testing';

import {JobManagerService} from '../core/job-manager.service';
import {SharedModule} from '../shared/shared.module';
import {Router} from "@angular/router";
import 'rxjs/add/observable/of';
import {RouteReuse} from '../route-reuse.service';
import {DashboardResolver} from "./dashboard.resolver.service";
import {DashboardComponent} from "./dashboard.component";
import {TotalSummaryComponent} from "./total-summary/total-summary.component";
import {GroupedSummaryComponent} from "./grouped-summary/grouped-summary.component";
import {FakeAggregationService} from "../testing/fake-aggregation.service";

describe('DashboardComponent', () => {
  let testComponent: DashboardComponent;
  let fixture: ComponentFixture<TestJobListComponent>;
  let fakeJobService: FakeAggregationService;

  beforeEach(async(() => {
    fakeJobService = new FakeAggregationService();

    TestBed.configureTestingModule({
      declarations: [
        AppComponent,
        DashboardComponent,
        TotalSummaryComponent,
        GroupedSummaryComponent,
        FakeProjectsComponent
      ],
      imports: [
        CommonModule,
        MatCardModule,
        MatDividerModule,
        MatTableModule,
        RouterTestingModule.withRoutes([
          {path: 'dashboard', component: DashboardComponent, resolve: {aggregations: DashboardResolver}},
          {path: 'projects', component: FakeProjectsComponent}
        ]),
        SharedModule
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

  @Component({
    selector: 'jm-test-app',
    template: '<router-outlet></router-outlet>'
  })
  class AppComponent {}

  @Component({
    selector: 'jm-test-job-list-component',
    template: '<jm-job-list [pageSize]="3"></jm-job-list>'
  })
  class TestJobListComponent {}

  @Component({
    selector: 'jm-fake-projects-component',
    template: '<div class="fake-projects"></div>'
  })
  class FakeProjectsComponent {}
});
