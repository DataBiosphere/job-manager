import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { GroupedSummaryComponent } from './grouped-summary.component';

describe('GroupedSummaryComponent', () => {
  let component: GroupedSummaryComponent;
  let fixture: ComponentFixture<GroupedSummaryComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ GroupedSummaryComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GroupedSummaryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
