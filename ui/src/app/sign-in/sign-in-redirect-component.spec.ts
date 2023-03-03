import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
} from "@angular/core/testing";
import { SignInRedirectComponent } from "./sign-in-redirect.component";
import { AuthService } from "../core/auth.service";
import { CommonModule } from '@angular/common';
import { RouterTestingModule } from '@angular/router/testing';
import { Router } from '@angular/router';
import { Component, DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';
import { SharedModule } from '../shared/shared.module';

describe("SignInRedirectComponent", () => {
  let fixture: ComponentFixture<AppComponent>;
  let de: DebugElement;
  const mockAuthService = jasmine.createSpyObj("AuthService", [
    "initOAuthImplicit",
    "isAuthenticated",
  ]);
  let router: Router;

  beforeEach(fakeAsync(() => {
    TestBed.configureTestingModule({
      declarations: [
        AppComponent,
        SignInRedirectComponent
      ],
      imports: [
        CommonModule,
        SharedModule,
        RouterTestingModule.withRoutes([
          {path: 'redirect-from-oauth', component: SignInRedirectComponent},
          {path: 'sign_in', component: TestSignInComponent},
          {path: 'return-url', component: TestReturnComponent}
        ])
      ],
      providers: [
        { provide: AuthService, useValue: mockAuthService }
      ]
    }).compileComponents();
  }));

  beforeEach(fakeAsync(() => {
    fixture = TestBed.createComponent(AppComponent);
    de = fixture.debugElement;
    router = TestBed.get(Router);
  }))

  it('should create the redirect page', fakeAsync(() => {
    router.initialNavigation();
    router.navigate(["redirect-from-oauth"]);
    tick();
    const component = de.query(By.css("redirect-from-oauth")).componentInstance;
    expect(component).toBeTruthy();
  }));

  it('should redirect to the sign in page if authorized (valid access token NOT present)', fakeAsync(() => {
    spyOn(window.localStorage, "getItem").and.returnValue(undefined);
    mockAuthService.isAuthenticated.and.returnValue(false);
    router.initialNavigation();
    router.navigate(["redirect-from-oauth"]);
    tick(); //simulate passage of time from redirect
    fixture.detectChanges(); //trigger the internal redirect logic in the component
    tick(); //simulate passage of time for redirect
    const component = de.query(By.css("jm-test-sign-in")).componentInstance;
    expect(component).toBeTruthy();
  }));

  it('should redirect to the stored returnUrl if the user is authorized (valid access token present)', fakeAsync(() => {
    spyOn(window.localStorage, "getItem").and.returnValue('/return-url');
    mockAuthService.isAuthenticated.and.returnValue(true);
    router.initialNavigation();
    router.navigate(["redirect-from-oauth"]);
    tick();
    fixture.detectChanges();
    tick();
    const component = de.query(By.css("jm-test-return-url")).componentInstance;
    expect(component).toBeTruthy();
  }));
});

@Component({
  selector: "jm-test-app",
  template: "<router-outlet></router-outlet>",
})
class AppComponent {}

@Component({
  selector: "jm-test-sign-in",
  template: "<router-outlet></router-outlet>",
})
class TestSignInComponent {}

@Component({
  selector: "jm-test-return-url",
  template: "<router-outlet></router-outlet>"
})
class TestReturnComponent {}
