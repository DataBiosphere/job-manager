import {BehaviorSubject} from 'rxjs/BehaviorSubject';
import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import {DataSource} from '@angular/cdk/collections';
import {Observable} from 'rxjs/Observable';

import {JobMetadataResponse} from '../../shared/model/JobMetadataResponse';
import {JobStatus} from '../../shared/model/JobStatus';
import {JobStatusIcon} from '../../shared/common';
import {TaskMetadata} from '../../shared/model/TaskMetadata';
import {JobFailuresTableComponent} from "../common/failures-table/failures-table.component";
import {JobTimingDiagramComponent} from "./timing-diagram/timing-diagram.component";
import {JobManagerService} from "../../core/job-manager.service";
import {TaskShard} from "../../shared/model/TaskShard";

@Component({
  selector: 'jm-tabs',
  templateUrl: './tabs.component.html',
  styleUrls: ['./tabs.component.css'],
})
export class JobTabsComponent implements OnInit, OnChanges {

  @Input() tasks: TaskMetadata[] = [];
  @Input() job: JobMetadataResponse;
  @Input() selectedTab: number;
  @Output() navDown: EventEmitter<string> = new EventEmitter();
  @ViewChild(JobFailuresTableComponent) failuresTable: JobFailuresTableComponent;
  @ViewChild(JobTimingDiagramComponent) timingDiagram: JobTimingDiagramComponent;
  @ViewChild('tabsPanel') tabsPanel;

  database = new TasksDatabase(this.tasks);
  dataSource: TasksDataSource | null;
  displayedColumns = [
    'name',
    'status',
    'startTime',
    'duration',
    'attempts',
    'files',
  ];
  tabWidth: number = 1024;

  constructor(private readonly jobManagerService: JobManagerService) {};

  ngOnInit() {
    this.dataSource = new TasksDataSource(this.database);
    if (this.hasCallCachedTask() || this.hasScatteredTask()) {
      this.displayedColumns.splice(1, 0, "taskInfoIcons");
    }
    if (this.tabsPanel) {
      this.tabWidth = this.tabsPanel._viewContainerRef.element.nativeElement.clientWidth;
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    this.tasks = changes.tasks.currentValue;
    this.database.dataChange.next(this.tasks);
  }

  getStatusIcon(status: JobStatus): string {
    return JobStatusIcon[status];
  }

  hasCallCachedTask(): boolean {
    if (this.tasks.find(t => t.callCached === true)) {
      return true;
    }
    return false;
  }

  hasScatteredTask(): boolean {
    if (this.tasks.find(t => t.shards !== null)) {
      return true;
    }
    return false;
  }

  hasFailures(): boolean {
    return this.job.failures && (this.job.failures.length !== 0);
  }

  hasInputs(): boolean {
    return this.job.inputs && (Object.keys(this.job.inputs).length !== 0);
  }

  hasOutputs(): boolean {
    return this.job.outputs && (Object.keys(this.job.outputs).length !== 0);
  }

  hasTasks(): boolean {
    if (this.job.extensions) {
      let tasks: TaskMetadata[] = this.job.extensions.tasks || [];
      return tasks.length > 0;
    }
  }

  navigateDown(id: string): void {
    if (id) {
      this.navDown.emit(id);
    }
  }

  getScatteredCountTotal(task: TaskMetadata): number {
    if (task.shards) {
      return task.shards.length;
    }
  }

  // these are the shard statuses we care about
  getShardStatuses(): JobStatus[] {
    return [JobStatus.Succeeded,
            JobStatus.Failed,
            JobStatus.Running,
            JobStatus.Submitted];
   }

  getShardCountByStatus(task:TaskMetadata, status:JobStatus): number {
    let result = 0
    if(task.shards) {
      task.shards.forEach((thisShard) => {
        if (status == JobStatus[thisShard.executionStatus]) {
          result++;
          return;
        }
      });
    }
    return result;
  }

  taskIsScattered(task:TaskMetadata): boolean {
    return (task.shards && task.shards.length > 0)
  }

  getShardIndex(shard:TaskShard): number {
    return shard.shardIndex;
  }

  populateTaskAttempts(task: TaskMetadata) {
    this.jobManagerService.getTaskAttempts(this.job.id, this.getJobTaskName(task.name)).then((response) => {
      task.attemptsData = response.attempts;
    })
  }

  populateShardAttempts(task: TaskMetadata, shard: TaskShard) {
    this.jobManagerService.getShardAttempts(this.job.id, this.getJobTaskName(task.name), shard.shardIndex).then((response) => {
      shard.attemptsData = response.attempts;
    })
  }

  getJobTaskName(taskName: string): string {
    const parts = this.job.name.split('.');
    return parts.pop() + '.' + taskName;
  }
}

/** Simple database with an observable list of jobs to be subscribed to by the
 *  DataSource. */
export class TasksDatabase {
  private tasks: TaskMetadata[];
  /** Stream that emits whenever the data has been modified. */
  dataChange: BehaviorSubject<TaskMetadata[]> =
    new BehaviorSubject<TaskMetadata[]>(this.tasks);
  get data(): TaskMetadata[] { return this.dataChange.value; }

  constructor(tasks: TaskMetadata[]) {
    this.tasks = tasks;
    this.dataChange.next(this.tasks);
  }
}

/** DataSource providing the list of tasks to be rendered in the table. */
export class TasksDataSource extends DataSource<any> {
  tasks: TaskMetadata[];

  constructor(private _db: TasksDatabase) {
    super();
  }

  connect(): Observable<TaskMetadata[]> {
    const displayDataChanges = [
      this._db.dataChange,
    ];

    return Observable.merge(...displayDataChanges).map(() => {
      if (this._db.data) {
        return this._db.data.slice();
      }
    });
  }

  disconnect() {}
}
