import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TotalSummaryComponent } from './total-summary.component';

describe('TotalSummaryComponent', () => {
  let component: TotalSummaryComponent;
  let fixture: ComponentFixture<TotalSummaryComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TotalSummaryComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TotalSummaryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // it('should create', () => {
  //   expect(component).toBeTruthy();
  // });
});
