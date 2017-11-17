import {TestBed, async, ComponentFixture} from '@angular/core/testing';
import {By} from '@angular/platform-browser';
import {CommonModule} from '@angular/common';
import {Component, DebugElement, ViewChild} from '@angular/core';
import {
  MdButtonModule,
  MdTableModule,
  MdTabsModule,
  MdTooltipModule,
} from '@angular/material';
import {BrowserAnimationsModule} from "@angular/platform-browser/animations";
import {TaskDetailsComponent} from './tasks.component';
import {SharedModule} from '../../shared/shared.module';
import {TaskMetadata} from "../../shared/model/TaskMetadata";


describe('TaskDetailsComponent', () => {
  let testComponent: TestTasksComponent;
  let fixture: ComponentFixture<TestTasksComponent>;
  let task: TaskMetadata = {
    name: 'task1',
    jobId: '',
    executionStatus: 'Failed',
    start: new Date("2017-11-14T13:00:00"),
    end: new Date("2017-11-14T13:15:00"),
    attempts: 1,
    failures: [],
    returnCode: 0,
    stderr: 'gs://test-bucket/stderr.txt',
    stdout: 'gs://test-bucket/stdout.txt',
    inputs: {}
  };
  let testTasks: TaskMetadata[] = [task];

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        TaskDetailsComponent,
        TestTasksComponent
      ],
      imports: [
        BrowserAnimationsModule,
        CommonModule,
        MdButtonModule,
        MdTableModule,
        MdTabsModule,
        MdTooltipModule,
        SharedModule
      ]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TestTasksComponent);
    testComponent = fixture.componentInstance;
  });

  it('should display a row for each task', async(() => {
    fixture.detectChanges();
    let de: DebugElement = fixture.debugElement;
    expect(de.queryAll(By.css('.mat-row')).length).toEqual(testComponent.tasks.length);
  }));

  it('should display task data in each row', async(() => {
    fixture.detectChanges();
    let de: DebugElement = fixture.debugElement;
    expect(de.queryAll(By.css('.mat-column-name'))[1].nativeElement.textContent)
      .toEqual(task.name);
    expect(de.query(By.css('.task-status-tooltip')).attributes['ng-reflect-message'])
      .toContain('Failed');
    expect(de.queryAll(By.css('.mat-column-startTime'))[1].nativeElement.textContent)
      .toContain('1:00 PM');
    expect(de.queryAll(By.css('.mat-column-duration'))[1].nativeElement.textContent)
      .toEqual('0h 15m');
    expect(de.queryAll(By.css('.mat-column-attempts'))[1].nativeElement.textContent)
      .toEqual(task.attempts.toString());
    expect(de.queryAll(By.css('.mat-column-stdout'))[1].nativeElement.textContent)
      .toContain('stdout.txt');
    expect(de.queryAll(By.css('.mat-column-stderr'))[1].nativeElement.textContent)
      .toContain('stderr.txt');
  }));

  @Component({
    selector: 'jm-test-tasks-component',
    template: `<jm-tasks [tasks]="tasks"></jm-tasks>`
  })
  class TestTasksComponent {
    public tasks = testTasks;
    @ViewChild(TaskDetailsComponent)
    public taskDetailsComponent: TaskDetailsComponent;
  }
});
