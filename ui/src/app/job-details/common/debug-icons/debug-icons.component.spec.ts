import { HttpClientModule } from "@angular/common/http";
import { Component, DebugElement, ViewChild } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogModule } from "@angular/material/dialog";
import { MatIconModule, MatIconRegistry } from "@angular/material/icon";
import { MatSnackBarModule } from "@angular/material/snack-bar";
import { By, DomSanitizer } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ClrIconModule, ClrTooltipModule } from '@clr/angular';
import { ConfigLoaderService } from "../../../../environments/config-loader.service";
import { AuthService } from "../../../core/auth.service";
import { CapabilitiesService } from "../../../core/capabilities.service";
import { GcsService } from "../../../core/gcs.service";
import { JobManagerService } from "../../../core/job-manager.service";
import { SamService } from "../../../core/sam.service";
import { SharedModule } from '../../../shared/shared.module';
import { FakeCapabilitiesService } from "../../../testing/fake-capabilities.service";
import { FakeConfigLoaderService } from "../../../testing/fake-config-loader.service";
import { FakeJobManagerService } from "../../../testing/fake-job-manager.service";
import { JobDebugIconsComponent } from "./debug-icons.component";

describe('JobDebugIconsComponent', () => {
  let fixture: ComponentFixture<TestDebugIconsComponent>;
  let testComponent: TestDebugIconsComponent;
  let iconRegistry;
  let sanitizer;
  let job = {
    failure: 'things went wrong',
    backendLog: 'gs://test-bucket/test-log.txt',
    callRoot: 'gs://test-bucket/test-job'
  };
  let fakeCapabilitiesService =  new FakeCapabilitiesService({});
  let fakeJobService: FakeJobManagerService;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        TestDebugIconsComponent,
        JobDebugIconsComponent
      ],
      imports: [
        BrowserAnimationsModule,
        ClrIconModule,
        ClrTooltipModule,
        HttpClientModule,
        MatDialogModule,
        MatIconModule,
        MatSnackBarModule,
        SharedModule
      ],
      providers: [
        {provide: GcsService},
        {provide: AuthService, useValue: new AuthService(null, fakeCapabilitiesService, null, null)},
        {provide: CapabilitiesService, useValue: fakeCapabilitiesService},
        {provide: JobManagerService, useValue: fakeJobService},
        {provide: SamService},
        {provide: ConfigLoaderService, useValue: new FakeConfigLoaderService()}
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    iconRegistry = TestBed.get(MatIconRegistry);
    sanitizer = TestBed.get(DomSanitizer);
    iconRegistry.addSvgIcon('cloud-file', sanitizer.bypassSecurityTrustResourceUrl('/assets/images/icon-cloud-file.svg'));
    fixture = TestBed.createComponent(TestDebugIconsComponent);
    testComponent = fixture.componentInstance;
  });

  it('should not display message icon if displayMessage is set to false', async(() => {
    fixture.detectChanges();
    let de: DebugElement = fixture.debugElement;
    expect(de.queryAll(By.css('clr-icon[shape=exclamation-triangle]')).length).toEqual(0);
  }));

  it('should display message icon if displayMessage is set to true', async(() => {
    fixture.detectChanges();
    testComponent.jobDebugIconsComponent.displayMessage = true;
    let de: DebugElement = fixture.debugElement;
    fixture.detectChanges();
    expect(de.queryAll(By.css('clr-icon[shape=exclamation-triangle]')).length).toEqual(1);
  }));

  it('should calculate the right location for backend log', async(() => {
    fixture.detectChanges();
    expect(testComponent.jobDebugIconsComponent.getResourceUrl(job.backendLog) == 'https://console.cloud.google.com/storage/browser/test-bucket/test-job?prefix=test-log.txt');
  }));

  it('should link to the right location for execution directory', async(() => {
    fixture.detectChanges();
    let de: DebugElement = fixture.debugElement;
    expect(de.queryAll(By.css('a.log-item'))[0].nativeElement.href).toEqual('https://console.cloud.google.com/storage/browser/test-bucket/test-job/');
  }));

  @Component({
    selector: 'jm-test-debug-icons-component',
    template: `<jm-debug-icons [displayMessage]="false"
                               [jobId]=""
                               [message]="job.failure"
                               [backendLog]="job.backendLog"
                               [directory]="job.callRoot"></jm-debug-icons>`
  })
  class TestDebugIconsComponent {
    public job = job;
    @ViewChild(JobDebugIconsComponent)
    public jobDebugIconsComponent: JobDebugIconsComponent;
  }
});
