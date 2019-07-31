import {HttpClientModule} from "@angular/common/http";
import {TestBed, async, ComponentFixture} from '@angular/core/testing';
import {By, DomSanitizer} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {Component, DebugElement, ViewChild} from '@angular/core';
import {ClrIconModule, ClrTooltipModule} from '@clr/angular';
import {SharedModule} from '../../../shared/shared.module';
import {JobDebugIconsComponent} from "./debug-icons.component";
import {AuthService} from "../../../core/auth.service";
import {FakeCapabilitiesService} from "../../../testing/fake-capabilities.service";
import {MatSnackBarModule, MatIconModule, MatIconRegistry} from "@angular/material";
import {GcsService} from "../../../core/gcs.service";
import {JobManagerService} from "../../../core/job-manager.service";
import {FakeJobManagerService} from "../../../testing/fake-job-manager.service";
import {CapabilitiesService} from "../../../core/capabilities.service";

describe('JobDebugIconsComponent', () => {
  let fixture: ComponentFixture<TestDebugIconsComponent>;
  let testComponent: TestDebugIconsComponent;
  let iconRegistry;
  let sanitizer;
  let job = {
    failure: 'things went wrong',
    stdout : 'gs://test-bucket/test-job/stdout.txt',
    stderr: 'gs://test-bucket/test-job/stderr.txt',
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
        MatIconModule,
        MatSnackBarModule,
        SharedModule
      ],
      providers: [
        {provide: GcsService},
        {provide: AuthService, useValue: new AuthService(null, fakeCapabilitiesService, null, null)},
        {provide: CapabilitiesService, useValue: fakeCapabilitiesService},
        {provide: JobManagerService, useValue: fakeJobService},
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

  it('should calculate the right location for stdout', async(() => {
    fixture.detectChanges();
    expect(testComponent.jobDebugIconsComponent.getResourceUrl(job.stdout) == 'https://console.cloud.google.com/storage/browser/test-bucket/test-job?prefix=stdout.txt');
  }));

  it('should calculate the right location for stderr', async(() => {
    fixture.detectChanges();
    let de: DebugElement = fixture.debugElement;
    expect(testComponent.jobDebugIconsComponent.getResourceUrl(job.stderr) == 'https://console.cloud.google.com/storage/browser/test-bucket/test-job?prefix=stderr.txt');
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
                               [stdout]="job.stdout"
                               [stderr]="job.stderr"
                               [directory]="job.callRoot"></jm-debug-icons>`
  })
  class TestDebugIconsComponent {
    public job = job;
    @ViewChild(JobDebugIconsComponent)
    public jobDebugIconsComponent: JobDebugIconsComponent;
  }
});
