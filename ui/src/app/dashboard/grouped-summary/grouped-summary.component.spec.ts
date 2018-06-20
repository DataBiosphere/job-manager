import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { GroupedSummaryComponent } from './grouped-summary.component';
import {MatCardModule, MatDividerModule, MatTableModule} from "@angular/material";
import {TotalSummaryComponent} from "../total-summary/total-summary.component";
import {CommonModule} from "@angular/common";
import {DashboardComponent} from "../dashboard.component";
import {Component} from "@angular/core";

describe('GroupedSummaryComponent', () => {
  let component: GroupedSummaryComponent;
  let fixture: ComponentFixture<GroupedSummaryComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        GroupedSummaryComponent
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
    fixture = TestBed.createComponent(GroupedSummaryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // fit('should create', () => {
  //   expect(component).toBeTruthy();
  // });

  @Component({
    selector: `test-host-component`,
    template: `<component-under-test input="test input"></component-under-test>`
  })
  class TestHostComponent {
  }
});
