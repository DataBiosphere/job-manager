import {async, ComponentFixture, fakeAsync, TestBed, tick} from '@angular/core/testing';
import {
  MatButtonModule,
  MatCardModule,
  MatSelectModule,
  MatSortModule,
  MatTableModule
} from "@angular/material";
import {CommonModule} from "@angular/common";
import {By} from "@angular/platform-browser";
import {Component, DebugElement} from "@angular/core";

import {GroupedSummaryComponent} from './grouped-summary.component';
import {JobStatus} from "../../shared/model/JobStatus";
import {Aggregation} from "../../shared/model/Aggregation";
import {ActivatedRoute} from "@angular/router";
import {RouterTestingModule} from "@angular/router/testing";
import {ClrIconModule, ClrTooltipModule} from "@clr/angular";
import {SharedModule} from "../../shared/shared.module";
import {BrowserAnimationsModule} from "@angular/platform-browser/animations";

const testStatusArray = [JobStatus.Succeeded, JobStatus.Failed];
const testAggregation: Aggregation = {
  entries: [
    {
      label: "owner1",
      statusCounts: {
        counts: [
          {
            count: 1,
            status: JobStatus.Succeeded
          },
          {
            count: 6,
            status: JobStatus.Failed
          }
        ]
      }
    },
    {
      label: "owner2",
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
    },
    {
      label: "owner3",
      statusCounts: {
        counts: [
          {
            count: 3,
            status: JobStatus.Succeeded
          },
          {
            count: 7,
            status: JobStatus.Failed
          }
        ]
      }
    },
    {
      label: "owner4",
      statusCounts: {
        counts: [
          {
            count: 4,
            status: JobStatus.Succeeded
          },
          {
            count: 7,
            status: JobStatus.Failed
          }
        ]
      }
    },
    {
      label: "owner5",
      statusCounts: {
        counts: [
          {
            count: 5,
            status: JobStatus.Succeeded
          },
          {
            count: 7,
            status: JobStatus.Failed
          }
        ]
      }
    },
    {
      label: "owner6",
      statusCounts: {
        counts: [
          {
            count: 6,
            status: JobStatus.Succeeded
          },
          {
            count: 7,
            status: JobStatus.Failed
          }
        ]
      }
    },
  ]
};

describe('GroupedSummaryComponent', () => {
  let hostComponent: TestHostComponent;
  let testComponent: GroupedSummaryComponent;
  let fixture: ComponentFixture<TestHostComponent>;
  let de: DebugElement;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        GroupedSummaryComponent,
        TestHostComponent
      ],
      imports: [
        ClrIconModule,
        ClrTooltipModule,
        CommonModule,
        BrowserAnimationsModule,
        MatCardModule,
        MatTableModule,
        MatSortModule,
        MatButtonModule,
        MatSelectModule,
        RouterTestingModule,
        SharedModule,
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
    de = fixture.debugElement;
    hostComponent = fixture.componentInstance;
    hostComponent.aggregation = testAggregation;
    hostComponent.statusArray = testStatusArray;
    testComponent = fixture.debugElement.query(By.css('jm-grouped-summary')).componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(testComponent).toBeTruthy();
  });

  it('should have collapse and expand arrow when number of entries is larger than 5', fakeAsync(() => {
    expect(de.query(By.css('.arrow'))).toBeTruthy();
  }));

  it('should only show the first 5 entries at the initial state', fakeAsync(() => {
    const rowNumber = de.queryAll(By.css('jm-grouped-summary td.label-value')).length;
    expect(rowNumber).toEqual(5)
  }));

  it('should only show all entries after click on the expand arrow', fakeAsync(() => {
    const arrow = de.query(By.css('.arrow')).nativeElement;
    arrow.click();
    fixture.detectChanges();
    tick();
    const rowNumber = de.queryAll(By.css('jm-grouped-summary td.label-value')).length;
    expect(rowNumber).toEqual(6);
  }));

  it('should sort the entries when table head is clicked', fakeAsync(() => {
    const arrow = de.query(By.css('.arrow')).nativeElement;
    arrow.click();

    const successTableHead = de.queryAll(By.css('tr th'))[1].nativeElement;
    successTableHead.click();

    fixture.detectChanges();
    tick();

    const rows = de.queryAll(By.css('tr.data'));

    // assert the values are sorted ascending
    let last = 0;
    for (let row of rows) {
      const cur = Number(row.queryAll(By.css('td'))[1].nativeElement.innerText);
      expect(cur).toBeGreaterThanOrEqual(last);
      last = cur
    }
  }));

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


