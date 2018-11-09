import {async, ComponentFixture, TestBed} from "@angular/core/testing";
import {MatCheckboxModule, MatListModule} from "@angular/material";
import {BrowserAnimationsModule} from "@angular/platform-browser/animations";
import {ReactiveFormsModule} from "@angular/forms";
import {RouterTestingModule} from "@angular/router/testing";
import {StatusSelectionComponent} from "./status-selection.component";
import {Component, ViewChild} from "@angular/core";

describe('StatusSelectionComponent', () => {

  let parentComponent: TestStatusSelectionComponent;
  let testComponent: StatusSelectionComponent;
  let fixture: ComponentFixture<TestStatusSelectionComponent>;
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        StatusSelectionComponent,
        TestStatusSelectionComponent,
      ],
      imports: [
        BrowserAnimationsModule,
        MatCheckboxModule,
        MatListModule,
        ReactiveFormsModule,
        RouterTestingModule.withRoutes([
          {path: '', component: TestStatusSelectionComponent},
          {path: 'jobs', component: TestStatusSelectionComponent}
        ]),
      ],
    }).compileComponents();
  }));

  beforeEach(async(() => {
    fixture = TestBed.createComponent(TestStatusSelectionComponent);
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
    testComponent.changeStatus('Running', false);
    testComponent.changeStatus('Completed', true);
    testComponent.changeStatus('Aborted', true);

    expect(parentComponent.updateValueCallback).toHaveBeenCalledTimes(3);
    expect(parentComponent.updateValueCallback).toHaveBeenCalledWith("Failed");
    expect(parentComponent.updateValueCallback).toHaveBeenCalledWith("Failed,Completed");
    expect(parentComponent.updateValueCallback).toHaveBeenCalledWith("Failed,Completed,Aborted");
  }));

  @Component({
    selector: 'jm-test-status-selection-component',
    template:
      `<jm-status-selection
        [initialChipValue]="initialValue"
        (updateValue)="updateValueCallback($event)"></jm-status-selection>`
  })
  class TestStatusSelectionComponent {
    @ViewChild(StatusSelectionComponent)
    public statusSelectionComponent: StatusSelectionComponent;
    initialValue="Running,Failed";
    updateValueCallback(newValue): void { }
  }
});
