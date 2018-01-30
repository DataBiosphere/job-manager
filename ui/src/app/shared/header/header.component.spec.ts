import {async, ComponentFixture, TestBed} from "@angular/core/testing";
import {By} from "@angular/platform-browser";
import {Component, DebugElement, ViewChild} from "@angular/core";
import {
  MatAutocompleteModule,
  MatButtonModule,
  MatChipsModule, MatDatepickerInputEvent,
  MatDatepickerModule,
  MatIconModule,
  MatInputModule,
  MatMenuModule,
  MatNativeDateModule,
} from "@angular/material";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {RouterTestingModule} from "@angular/router/testing";
import {BrowserAnimationsModule} from "@angular/platform-browser/animations";

import {HeaderComponent} from "./header.component";
import {startCol} from "../common";


describe('HeaderComponent', () => {

  let testComponent: HeaderComponent;
  let fixture: ComponentFixture<TestHeaderComponent>;

  beforeEach(async(() => {

    TestBed.configureTestingModule({
      declarations: [HeaderComponent, TestHeaderComponent],
      imports: [
        BrowserAnimationsModule,
        FormsModule,
        MatAutocompleteModule,
        MatButtonModule,
        MatChipsModule,
        MatDatepickerModule,
        MatIconModule,
        MatInputModule,
        MatMenuModule,
        MatNativeDateModule,
        ReactiveFormsModule,
        RouterTestingModule.withRoutes([
          {path: '', component: TestHeaderComponent}
        ]),
      ]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TestHeaderComponent);
    testComponent = fixture.componentInstance.headerComponent;
    testComponent.chips = new Map()
      .set('parent-id', 'Parent ID')
      .set('job-name', 'Job Name');
  });

  it('should display a chip for each query filter', async(() => {
    fixture.detectChanges();
    let de: DebugElement = fixture.debugElement;
    expect(de.queryAll(By.css('#chip')).length).toEqual(2);
  }));

  it('should stage a chip', async ( () => {
    testComponent.addChip('key');
    fixture.detectChanges();
    expect(testComponent.chips.get('key')).toEqual('');
    expect(fixture.debugElement.queryAll(By.css('#chip')).length).toEqual(3);
  }));

  it('should stage and complete a free text chip', async (() => {
    testComponent.addChip('key');
    testComponent.setCurrentChip('key');
    testComponent.currentChipValue = 'value';
    testComponent.assignChipValue();
    fixture.detectChanges();
    expect(testComponent.chips.get('key')).toEqual('value');
    expect(fixture.debugElement.queryAll(By.css('#chip')).length).toEqual(3);
  }));

  it('should stage and complete a date chip', async (() => {
    testComponent.addChip(startCol);
    testComponent.setCurrentChip(startCol);
    testComponent.assignDateValue(new Date("11/11/2011"));
    fixture.detectChanges();
    expect(testComponent.chips.get(startCol)).toEqual('11/11/2011');
    expect(fixture.debugElement.queryAll(By.css('#chip')).length).toEqual(3);
  }));

  it('should replace existing chip', async (() => {
    testComponent.addChip('key');
    testComponent.setCurrentChip('key');
    testComponent.currentChipValue = 'value1';
    testComponent.assignChipValue();
    testComponent.addChip('key: value2');
    fixture.detectChanges();
    expect(testComponent.chips.get('key')).toEqual('value2');
    expect(fixture.debugElement.queryAll(By.css('#chip')).length).toEqual(3);
  }));

  it('should not show status buttons', async(() => {
    fixture.detectChanges();
    expect(fixture.debugElement.queryAll(By.css('.status-button')).length).toEqual(3);
  }));

  it('should show status buttons', async(() => {
    testComponent.chips.set('statuses', 'list,of,statuses');
    expect(fixture.debugElement.queryAll(By.css('.status-button')).length).toEqual(0);
  }));

  @Component({
    selector: 'jm-test-table-component',
    template:
      `<jm-header></jm-header>`
  })
  class TestHeaderComponent {
    @ViewChild(HeaderComponent)
    public headerComponent: HeaderComponent;
  }
});
