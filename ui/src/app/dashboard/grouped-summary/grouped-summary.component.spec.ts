import {async, ComponentFixture, TestBed} from '@angular/core/testing';
import {MatCardModule, MatDividerModule, MatTableModule} from "@angular/material";
import {CommonModule} from "@angular/common";
import {By} from "@angular/platform-browser";
import {Component} from "@angular/core";

import {GroupedSummaryComponent} from './grouped-summary.component';
import {JobStatus} from "../../shared/model/JobStatus";
import {Aggregation} from "../../shared/model/Aggregation";
import {ActivatedRoute, RouterModule} from "@angular/router";
import {RouteReuse} from "../../route-reuse.service";
import {JobListResolver} from "../../job-list/job-list-resolver.service";
import {RouterTestingModule} from "@angular/router/testing";

const testStatusArray = [JobStatus.Succeeded, JobStatus.Failed];
const testAggregation: Aggregation = {
  entries: [
    {
      label: "owner1",
      statusCounts: {
        counts: [
          {
            count: 2,
            status: JobStatus.Succeeded
          },
          {
            count: 7,
            status: JobStatus.Failed
          }
        ]
      }
    }
  ]
};

describe('GroupedSummaryComponent', () => {
  let hostComponent: TestHostComponent;
  let testComponent: GroupedSummaryComponent;
  let fixture: ComponentFixture<TestHostComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        GroupedSummaryComponent,
        TestHostComponent
      ],
      imports: [
        CommonModule,
        MatCardModule,
        MatDividerModule,
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
    hostComponent.aggregation = testAggregation;
    hostComponent.statusArray = testStatusArray;
    testComponent = fixture.debugElement.query(By.css('jm-grouped-summary')).componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(testComponent).toBeTruthy();
  });

  @Component({
    selector: `jm-test-host-component`,
    template: `<jm-grouped-summary [aggregation]="aggregation"
                                   [statusArray]="statusArray"></jm-grouped-summary>`
  })

  class TestHostComponent {
    public aggregation: Aggregation;
    public statusArray: Array<JobStatus>;
  }
});


