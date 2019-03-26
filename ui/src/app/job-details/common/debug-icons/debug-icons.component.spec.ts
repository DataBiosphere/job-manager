import {TestBed, async, ComponentFixture} from '@angular/core/testing';
import {By} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {Component, DebugElement, ViewChild} from '@angular/core';
import {ClrIconModule, ClrTooltipModule} from '@clr/angular';
import {SharedModule} from '../../../shared/shared.module';
import {JobDebugIconsComponent} from "./debug-icons.component";
import {JobMetadataResponse} from "../../../shared/model/JobMetadataResponse";
import {AuthService} from "../../../core/auth.service";
import {FakeCapabilitiesService} from "../../../testing/fake-capabilities.service";
import {MatSnackBar} from "@angular/material";

describe('JobDebugIconsComponent', () => {
  let fixture: ComponentFixture<TestDebugIconsComponent>;
  let snackBar: MatSnackBar;
  let testComponent: JobDebugIconsComponent;
  let job: JobMetadataResponse = {
    failure: 'things went wrong',
    stdout : 'gs://test-bucket/test-job/stdout.txt',
    stderr: 'gs://test-bucket/test-job/stderr.txt',
    callRoot: 'gs://test-bucket/test-job'
  };

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
        SharedModule
      ],
      providers: [
        {provide: AuthService, useValue: new AuthService(null, new FakeCapabilitiesService({}), null, snackBar)}
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
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
    testComponent.displayMessage = true;
    let de: DebugElement = fixture.debugElement;
    fixture.detectChanges();
    expect(de.queryAll(By.css('clr-icon[shape=exclamation-triangle]')).length).toEqual(1);
  }));

  it('should link to the right location for stdout', async(() => {
    fixture.detectChanges();
    let de: DebugElement = fixture.debugElement;
    expect(de.queryAll(By.css('a.log-item'))[0].nativeElement.href).toEqual('https://console.cloud.google.com/storage/browser/test-bucket/test-job?prefix=stdout.txt');
  }));

  it('should link to the right location for stderr', async(() => {
    fixture.detectChanges();
    let de: DebugElement = fixture.debugElement;
    expect(de.queryAll(By.css('a.log-item'))[1].nativeElement.href).toEqual('https://console.cloud.google.com/storage/browser/test-bucket/test-job?prefix=stderr.txt');
  }));

  it('should link to the right location for execution directory', async(() => {
    fixture.detectChanges();
    let de: DebugElement = fixture.debugElement;
    expect(de.queryAll(By.css('a.log-item'))[2].nativeElement.href).toEqual('https://console.cloud.google.com/storage/browser/test-bucket/test-job/');
  }));

  @Component({
    selector: 'jm-test-debug-icons-component',
    template: `<jm-debug-icons [displayMessage]="displayMessage"
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
