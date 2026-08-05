import { provideHttpClient, withInterceptorsFromDi } from "@angular/common/http";
import { Component, DebugElement, ViewChild } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { MatDialogModule } from "@angular/material/dialog";
import { MatIconModule, MatIconRegistry } from "@angular/material/icon";
import { MatSnackBarModule } from "@angular/material/snack-bar";
import { By, DomSanitizer } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

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

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
    declarations: [
        TestDebugIconsComponent,
        JobDebugIconsComponent
    ],
    imports: [BrowserAnimationsModule,
        MatDialogModule,
        MatIconModule,
        MatSnackBarModule,
        SharedModule],
    providers: [
        { provide: GcsService },
        { provide: AuthService, useValue: new AuthService(null, fakeCapabilitiesService, null, null, null, null) },
        { provide: CapabilitiesService, useValue: fakeCapabilitiesService },
        { provide: JobManagerService, useValue: fakeJobService },
        { provide: SamService },
        { provide: ConfigLoaderService, useValue: new FakeConfigLoaderService() },
        provideHttpClient(withInterceptorsFromDi())
    ]
}).compileComponents();
  }));

  beforeEach(() => {
    iconRegistry = TestBed.inject(MatIconRegistry);
    sanitizer = TestBed.inject(DomSanitizer);
    iconRegistry.addSvgIcon('cloud-file', sanitizer.bypassSecurityTrustResourceUrl('/assets/images/icon-cloud-file.svg'));
    fixture = TestBed.createComponent(TestDebugIconsComponent);
    testComponent = fixture.componentInstance;
  });

  it('should not display message icon if displayMessage is set to false', waitForAsync(() => {
    fixture.detectChanges();
    let de: DebugElement = fixture.debugElement;
    expect(de.queryAll(By.css('button.log-item.message-icon')).length).toEqual(0);
  }));

  it('should display message icon if displayMessage is set to true', waitForAsync(() => {
    fixture.detectChanges();
    testComponent.jobDebugIconsComponent.displayMessage = true;
    let de: DebugElement = fixture.debugElement;
    fixture.detectChanges();
    expect(de.queryAll(By.css('button.log-item.message-icon')).length).toEqual(1);
  }));

  it('should calculate the right location for backend log', waitForAsync(() => {
    fixture.detectChanges();
    testComponent.job.backendLog = 'gs://test-bucket/test-log.txt';
    fixture.detectChanges();
    expect(testComponent.jobDebugIconsComponent.getResourceUrl(testComponent.job.backendLog)).toEqual('https://console.cloud.google.com/storage/browser/test-bucket?prefix=test-log.txt');
  }));

  it('should link to the right location for execution directory', waitForAsync(() => {
    fixture.detectChanges();
    let de: DebugElement = fixture.debugElement;
    expect(de.queryAll(By.css('a.execution-directory-button'))[0].nativeElement.href).toEqual('https://console.cloud.google.com/storage/browser/test-bucket/test-job/');
  }));

  it('should not link to anything when there is no GCP Batch operation id', waitForAsync(() => {
    fixture.detectChanges();
    let de: DebugElement = fixture.debugElement;
    expect(de.queryAll(By.css('a.operation-details-button')).length).toBe(0);
  }));

  it('should not return a GCP Batch URL for unexpected operation ids', waitForAsync(() => {
    fixture.detectChanges();
    testComponent.jobDebugIconsComponent.operationId = "foo/bar";
    expect(testComponent.jobDebugIconsComponent.getOperationalDetailsUrl()).toEqual('');
  }));

  it('should not return a GCP Batch URL for PAPI operation ids', waitForAsync(() => {
    fixture.detectChanges();
    testComponent.jobDebugIconsComponent.operationId = "projects/1088423515928/locations/us-central1/operations/16424150744502";
    expect(testComponent.jobDebugIconsComponent.getOperationalDetailsUrl()).toEqual('');
  }));

  it('should return a GCP Batch URL for Batch operation ids', waitForAsync(() => {
    fixture.detectChanges();
    testComponent.jobDebugIconsComponent.operationId = "projects/my-nice-project/locations/the-moon/jobs/job-aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";
    let expectedUrl = "https://console.cloud.google.com/batch/jobsDetail/regions/the-moon/jobs/job-aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee/details?project=my-nice-project";
    expect(testComponent.jobDebugIconsComponent.getOperationalDetailsUrl()).toEqual(expectedUrl);
  }));

  it('should return a GCP Batch URL for Batch operation ids with the new human-readable format', waitForAsync(() => {
    fixture.detectChanges();
    testComponent.jobDebugIconsComponent.operationId = "projects/my-nice-project/locations/the-moon/jobs/job-e83cf9a5-imputationbeaglephase-0-2-f26c7050";
    fixture.detectChanges();
    let expectedUrl = "https://console.cloud.google.com/batch/jobsDetail/regions/the-moon/jobs/job-e83cf9a5-imputationbeaglephase-0-2-f26c7050/details?project=my-nice-project";
    expect(testComponent.jobDebugIconsComponent.getOperationalDetailsUrl()).toEqual(expectedUrl);
  }));

  it('should link to the right location for GCP Batch operation details', waitForAsync(() => {
    fixture.detectChanges();
    testComponent.jobDebugIconsComponent.operationId = "projects/my-nice-project/locations/the-moon/jobs/job-aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";
    fixture.detectChanges();
    let de: DebugElement = fixture.debugElement;
    let expectedUrl = "https://console.cloud.google.com/batch/jobsDetail/regions/the-moon/jobs/job-aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee/details?project=my-nice-project";
    expect(de.queryAll(By.css('a.operation-details-button'))[0].nativeElement.href).toEqual(expectedUrl);
  }));

  it('should link to the right location for GCP Batch logs', waitForAsync(() => {
    fixture.detectChanges();
    testComponent.jobDebugIconsComponent.operationId = "projects/my-nice-project/locations/the-moon/jobs/job-aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";
    testComponent.job.backendLog = "";
    fixture.detectChanges();
    let de: DebugElement = fixture.debugElement;
    let expectedUrl = "https://console.cloud.google.com/batch/jobsDetail/regions/the-moon/jobs/job-aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee/logs?project=my-nice-project";
    expect(de.queryAll(By.css('a.backend-log-button'))[0].nativeElement.href).toEqual(expectedUrl);
  }));

  it('should disable the log icon when backend log datum exists but the file cannot be loaded', waitForAsync(() => {
    fixture.detectChanges();
    testComponent.jobDebugIconsComponent.operationId = "projects/my-nice-project/locations/the-moon/jobs/job-aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";
    testComponent.job.backendLog = "f00bar"; // exists but not valid
    fixture.detectChanges();
    let de: DebugElement = fixture.debugElement;
    expect(de.queryAll(By.css('.backend-log-button'))[0].nativeElement.classList).toContain('disabled');
  }));

  @Component({
    selector: 'jm-test-debug-icons-component',
    template: `<jm-debug-icons [displayMessage]="false"
                               [jobId]=""
                               [operationId]=""
                               [message]="job.failure"
                               [backendLog]="job.backendLog"
                               [directory]="job.callRoot"></jm-debug-icons>`,
    standalone: false
})
  class TestDebugIconsComponent {
    public job = job;
    @ViewChild(JobDebugIconsComponent)
    public jobDebugIconsComponent: JobDebugIconsComponent;
  }
});
