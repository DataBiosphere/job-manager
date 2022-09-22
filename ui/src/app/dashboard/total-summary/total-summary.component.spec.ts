import {async, ComponentFixture, TestBed} from '@angular/core/testing';
import {Component} from "@angular/core";
import {By} from "@angular/platform-browser";
import {CommonModule} from "@angular/common";
import {MatCardModule} from "@angular/material/card";
import {MatTableModule} from "@angular/material/table";

import {TotalSummaryComponent} from './total-summary.component';
import {JobStatus} from "../../shared/model/JobStatus";
import {StatusCounts} from "../../shared/model/StatusCounts";
import {ActivatedRoute} from "@angular/router";
import {RouterTestingModule} from "@angular/router/testing";
import {ClrIconModule, ClrTooltipModule} from "@clr/angular";

const testSummary: StatusCounts = {
  counts: [
    {
      count: 10,
      status: JobStatus.Succeeded
    },
    {
      count: 2,
      status: JobStatus.Failed
    }
  ]
};

const testStatusArray: Array<JobStatus> = [JobStatus.Succeeded, JobStatus.Aborted, JobStatus.Running, JobStatus.Failed];

describe('TotalSummaryComponent', () => {
  let hostComponent: TestHostComponent;
  let testComponent: TotalSummaryComponent;
  let fixture: ComponentFixture<TestHostComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        TotalSummaryComponent,
        TestHostComponent
      ],
      imports: [
        ClrIconModule,
        ClrTooltipModule,
        CommonModule,
        MatCardModule,
        MatTableModule,
        RouterTestingModule,
      ],
      providers: [{provide: ActivatedRoute, useValue: {
          snapshot: {
            queryParams: {projectId: 'bvdp-jmui-testing'}
          }
        }},
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TestHostComponent);
    hostComponent = fixture.componentInstance;
    hostComponent.componentSummary = testSummary;
    hostComponent.statusArray = testStatusArray;
    testComponent = fixture.debugElement.query(By.css('jm-total-summary')).componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(testComponent).toBeTruthy();
  });

  @Component({
    selector: `jm-test-host-component`,
    template: `<jm-total-summary [summary]="componentSummary" [statusArray]="statusArray"></jm-total-summary>`
  })

  class TestHostComponent {
    public componentSummary: StatusCounts;
    public statusArray: Array<JobStatus>;
  }
});
