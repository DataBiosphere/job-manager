import { ActivatedRouteSnapshot, Router, RouterStateSnapshot } from '@angular/router';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {By} from '@angular/platform-browser';
import {RouterTestingModule} from '@angular/router/testing';
import {Injectable} from '@angular/core';
import {Location} from '@angular/common';
import {flush, TestBed, fakeAsync, tick, ComponentFixture, waitForAsync} from '@angular/core/testing';
import {ClrIconModule} from '@clr/angular';

import {AppComponent} from './app.component';
import {CoreModule} from './core/core.module';
import {JobListComponent} from './job-list/job-list.component';
import {JobDetailsComponent} from './job-details/job-details.component';
import {JobDetailsResolver} from './job-details/job-details-resolver.service';
import {JobListModule} from './job-list/job-list.module';
import {JobDetailsModule} from './job-details/job-details.module';
import {AuthService} from "./core/auth.service";
import {MatSnackBar} from "@angular/material/snack-bar";
import {FakeCapabilitiesService} from "./testing/fake-capabilities.service";
import {CustomIconService} from "./core/custom-icon.service";

describe('AppComponent', () => {
  let customIconService;
  let fixture: ComponentFixture<AppComponent>;
  let testComponent: AppComponent;

  beforeEach(waitForAsync(() => {
    let snackBar: MatSnackBar;
    let fakeCapabilitiesService = new FakeCapabilitiesService({});
    let authService = new AuthService(null, fakeCapabilitiesService, null, snackBar, null, null);

    TestBed.configureTestingModule({
      declarations: [
        AppComponent
      ],
      imports: [
        BrowserAnimationsModule,
        ClrIconModule,
        CoreModule,
        JobListModule,
        JobDetailsModule,
        RouterTestingModule.withRoutes([
          {path: '', redirectTo: 'jobs', pathMatch: 'full'},
          {path: 'jobs', component: JobListComponent},
          {path: 'jobs/:id', component: JobDetailsComponent, resolve: {
            job: JobDetailsResolver
          }},
          {path: 'error', component: JobDetailsComponent, resolve: {
            err: ErrorResolver
          }},
        ])
      ],
      providers: [
        ErrorResolver,
        {provide: AuthService, useValue: authService},
        {provide: CustomIconService, useValue: customIconService}
      ]
    }).compileComponents();
  }));

  beforeEach(() => {
    customIconService = TestBed.get(CustomIconService);
    fixture = TestBed.createComponent(AppComponent);
    testComponent = fixture.componentInstance;
  });

  it('should create the app', fakeAsync(() => {
    const app = fixture.debugElement.componentInstance;
    expect(app).toBeTruthy();
  }));

  it('should show an error on initial nav failure', waitForAsync(() => {
    const location = TestBed.get(Location);
    location.replaceState('error');
    const router: Router = TestBed.get(Router);

    // Mock the zone to catch unhandled rejections
    spyOn(Zone.current, 'runGuarded').and.callFake((fn: Function) => {
      try {
        return fn();
      } catch (e) {
        // Suppress the expected error from ErrorResolver
        if (e && e.status !== 500) {
          throw e;
        }
      }
    });

    // In newer Angular versions, navigation errors are handled differently
    // The ErrorResolver will reject, but Angular catches it and shows the error component
    router.initialNavigation();

    fixture.whenStable().then(() => {
      fixture.detectChanges();

      const errorComponent =
        fixture.debugElement.query(By.css('jm-initial-error'));
      expect(errorComponent).toBeTruthy();
      expect(errorComponent.nativeElement.textContent).toContain(ErrorResolver.error.title);
      expect(errorComponent.nativeElement.textContent).toContain("Job Manager is running but encountered a problem");
    });
  }));
});

@Injectable()
class ErrorResolver  {
  static readonly error = {
    status: 500,
    title: 'server exploded'
  }
  constructor() {}

  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<void> {
    return Promise.reject(ErrorResolver.error);
  }
}
