import {async, ComponentFixture, TestBed} from "@angular/core/testing";
import {MatCheckboxModule, MatListModule} from "@angular/material";
import {BrowserAnimationsModule} from "@angular/platform-browser/animations";
import {ReactiveFormsModule} from "@angular/forms";
import {RouterTestingModule} from "@angular/router/testing";
import {EnumSelectionComponent} from "./enum-selection.component";
import {Component, ViewChild} from "@angular/core";

describe('EnumSelectionComponent', () => {

  let parentComponent: TestEnumSelectionComponent;
  let testComponent: EnumSelectionComponent;
  let fixture: ComponentFixture<TestEnumSelectionComponent>;
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        EnumSelectionComponent,
        TestEnumSelectionComponent,
      ],
      imports: [
        BrowserAnimationsModule,
        MatCheckboxModule,
        MatListModule,
        ReactiveFormsModule,
        RouterTestingModule.withRoutes([
          {path: '', component: TestEnumSelectionComponent},
          {path: 'jobs', component: TestEnumSelectionComponent}
        ]),
      ],
    }).compileComponents();
  }));

  beforeEach(async(() => {
    fixture = TestBed.createComponent(TestEnumSelectionComponent);
    parentComponent = fixture.componentInstance;
    testComponent = parentComponent.statusSelectionComponent;
    fixture.detectChanges();
  }));

  it('should set up status list', async(() => {
    expect(testComponent.currentChipValues).toContain("Running");
    expect(testComponent.currentChipValues).toContain("Failed");
    expect(testComponent.currentChipValues.length).toEqual(2);
  }));

  it('should update status list', async( () => {
    spyOn(parentComponent, 'updateValueCallback').and.callThrough();

    testComponent.changeOption('Running', false);
    testComponent.changeOption('Completed', true);
    testComponent.changeOption('Aborted', true);

    expect(parentComponent.updateValueCallback).toHaveBeenCalledTimes(3);
    expect(parentComponent.updateValueCallback).toHaveBeenCalledWith("Failed");
    expect(parentComponent.updateValueCallback).toHaveBeenCalledWith("Failed,Completed");
    expect(parentComponent.updateValueCallback).toHaveBeenCalledWith("Failed,Completed,Aborted");
  }));

  @Component({
    selector: 'jm-test-enum-selection-component',
    template:
      `<jm-enum-selection
        [initialChipValue]="initialValue"
        (updateValue)="updateValueCallback($event)"></jm-enum-selection>`
  })
  class TestEnumSelectionComponent {
    @ViewChild(EnumSelectionComponent)
    public statusSelectionComponent: EnumSelectionComponent;
    initialValue="Running,Failed";
    updateValueCallback(newValue): void { }
  }
});
