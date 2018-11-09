import {async, ComponentFixture, TestBed} from "@angular/core/testing";
import {Component, Input, ViewChild} from "@angular/core";
import {FilterChipComponent} from "./filter-chip.component";
import {RouterTestingModule} from "@angular/router/testing";
import {
  MatCheckboxModule,
  MatChipsModule,
  MatDatepickerModule,
  MatFormFieldModule,
  MatInputModule,
  MatListModule,
  MatMenuModule,
  MatRadioModule
} from "@angular/material";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {BrowserAnimationsModule} from "@angular/platform-browser/animations";
import {CapabilitiesResponse} from "../../model/CapabilitiesResponse";
import {CapabilitiesService} from "../../../core/capabilities.service";
import {FakeCapabilitiesService} from "../../../testing/fake-capabilities.service";
import {By} from "@angular/platform-browser";
import {EnumSelectionComponent} from "./enum-selection.component";

describe('FilterChipComponent', () => {

  let testComponent: FilterChipComponent;
  let fixture: ComponentFixture<TestFilterChipComponent>;
  let capabilities: CapabilitiesResponse = {
    displayFields: [
      {field: 'status', display: 'Status'},
      {field: 'submission', display: 'Submitted'},
      {field: 'extensions.userId', display: 'User ID'},
      {field: 'labels.job-id', display: 'Job ID'}
    ],
    queryExtensions: ['projectId']
  };

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        FilterChipComponent,
        EnumSelectionComponent,
        MockDatepickerInputComponent,
        MockStatusSelectionComponent,
        TestFilterChipComponent,
      ],
      imports: [
        BrowserAnimationsModule,
        FormsModule,
        MatCheckboxModule,
        MatChipsModule,
        MatDatepickerModule,
        MatFormFieldModule,
        MatInputModule,
        MatListModule,
        MatMenuModule,
        MatRadioModule,
        ReactiveFormsModule,
        RouterTestingModule.withRoutes([
          {path: '', component: TestFilterChipComponent},
          {path: 'jobs', component: TestFilterChipComponent}
        ]),
      ],
      providers: [
        {provide: CapabilitiesService, useValue: new FakeCapabilitiesService(capabilities)}
      ],
    }).compileComponents();
  }));

  beforeEach(async(() => {
    fixture = TestBed.createComponent(TestFilterChipComponent);
    testComponent = fixture.componentInstance.filterChipComponent;
    fixture.detectChanges();
  }));

  it('should display default chip value', async(() => {
    expect(testComponent.getDisplayValue()).toBe("key: initialValue");
  }));

  it('should update chip value and trigger callback', async(() => {
    spyOn(fixture.componentInstance, 'updateValueCallback').and.callThrough();
    testComponent.setChipValue("newValue");
    expect(fixture.componentInstance.updateValueCallback).toHaveBeenCalledWith("newValue");
    expect(testComponent.getDisplayValue()).toBe("key: newValue");
  }));

  it('should trigger remove callback', async(() => {
    spyOn(fixture.componentInstance, 'removeChipCallback').and.callThrough();
    fixture.debugElement.query(By.css('.chip')).triggerEventHandler('remove', null);
    expect(fixture.componentInstance.removeChipCallback).toHaveBeenCalled();
  }));

  @Component({
    selector: 'jm-test-filter-chip-component',
    template:
      `<jm-filter-chip
        [chipKey]="'key'"
        [initialChipValue]="'initialValue'"
        (updateValue)="updateValueCallback($event)"
        (removeChip)="removeChipCallback()" ></jm-filter-chip>`
  })
  class TestFilterChipComponent {
    @ViewChild(FilterChipComponent)
    public filterChipComponent: FilterChipComponent;

    updateValueCallback(newValue): void { }

    removeChipCallback(): void { }
  }

  @Component({
    selector: 'jm-status-selection',
    template: ''
  })
  class MockStatusSelectionComponent {
    @Input() initialChipValue: string;
  }

  @Component({
    selector: 'jm-datepicker-input',
    template: ''
  })
  class MockDatepickerInputComponent {
    @Input() chipKey: string;
    @Input() initialChipValue: string;
  }
});
