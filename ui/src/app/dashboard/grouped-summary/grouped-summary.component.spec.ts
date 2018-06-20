import {async, ComponentFixture, TestBed} from '@angular/core/testing';
import {MatCardModule, MatDividerModule, MatTableModule} from "@angular/material";
import {CommonModule} from "@angular/common";
import {By} from "@angular/platform-browser";
import {Component} from "@angular/core";

import {GroupedSummaryComponent} from './grouped-summary.component';
import {JobStatus} from "../../shared/model/JobStatus";
import {Aggregation} from "../../shared/model/Aggregation";

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
      ],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TestHostComponent);
    hostComponent = fixture.componentInstance;
    hostComponent.setInput(testAggregation, testStatusArray);
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
    private aggregation: Aggregation;
    private statusArray: Array<JobStatus>;

    setInput(newAggregation: Aggregation, newStatusArray: Array<JobStatus>) {
      this.aggregation = newAggregation;
      this.statusArray = newStatusArray;
    }
  }
});


