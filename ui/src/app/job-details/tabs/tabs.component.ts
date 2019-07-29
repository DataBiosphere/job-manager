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
import {MatDialog} from "@angular/material";
import {Observable} from 'rxjs/Observable';

import {JobMetadataResponse} from '../../shared/model/JobMetadataResponse';
import {JobStatus} from '../../shared/model/JobStatus';
import {JobStatusIcon} from '../../shared/common';
import {TaskMetadata} from '../../shared/model/TaskMetadata';
import {JobFailuresTableComponent} from "../common/failures-table/failures-table.component";
import {JobTimingDiagramComponent} from "./timing-diagram/timing-diagram.component";
import {JobManagerService} from "../../core/job-manager.service";
import {Shard} from "../../shared/model/Shard";
import {JobScatteredAttemptsComponent} from "./scattered-attempts/scattered-attempts.component";
import {objectNotEmpty} from '../../shared/common';

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
  tabWidth: number = 1024;

  constructor(private readonly jobManagerService: JobManagerService,
              public scatteredAttemptsDialog: MatDialog) {};

  ngOnInit() {
    this.dataSource = new TasksDataSource(this.database);
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

  hasFailures(): boolean {
    return objectNotEmpty(this.job.failures);
  }

  hasInputs(task:TaskMetadata): boolean {
    return objectNotEmpty(task.inputs);
  }

  hasOutputs(task:TaskMetadata): boolean {
    return objectNotEmpty(task.outputs);
  }

  hasTasks(): boolean {
    if (this.job.extensions) {
      let tasks: TaskMetadata[] = this.job.extensions.tasks || [];
      return tasks.length > 0;
    }
  }

  hasTaskFailures(task: TaskMetadata): boolean {
    return objectNotEmpty(task.failureMessages);
  }

  hasOnlyOneAttempt(task: TaskMetadata): boolean {
    return task.attempts == 1;
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
    let result = 0;
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

  getTaskFailures(task: TaskMetadata): string {
    if (this.hasTaskFailures(task)) {
      return task.failureMessages.join('\n');
    }
  }

  taskIsScattered(task:TaskMetadata): boolean {
    return (task.shards && task.shards.length > 0)
  }

  populateTaskAttempts(task: TaskMetadata) {
    this.jobManagerService.getTaskAttempts(this.job.id, this.getJobTaskName(task.name)).then((response) => {
      task.attemptsData = response.attempts;
    })
  }

  getJobTaskName(taskName: string): string {
    const parts = this.job.name.split('.');
    return parts.pop() + '.' + taskName;
  }

  navigateDown(id: string): void {
    if (id) {
      this.navDown.emit(id);
    }
  }

  openScatteredAttemptsDialog(task: TaskMetadata): void {
    let trimmedShards: Shard[] = [];

    // remove executionEvents, since they're not needed outside the timing diagram,
    // and preserve start and end as Date objects for task shards
    task.shards.forEach((shard) => {
      let newShard: Shard = {};
      newShard.start = new Date(shard.start);
      newShard.end = new Date(shard.end);
      newShard.stdout = shard.stdout;
      newShard.stderr = shard.stderr;
      newShard.backendLog = shard.backendLog;
      newShard.callRoot = shard.callRoot;
      newShard.attempts = shard.attempts;
      newShard.shardIndex = shard.shardIndex;
      newShard.executionStatus = shard.executionStatus;
      newShard.failureMessages = shard.failureMessages;
      newShard.jobId = shard.jobId;
      trimmedShards.push(newShard);
    });

    const data = {
      taskId: this.job.id,
      taskName: this.getJobTaskName(task.name),
      shards: trimmedShards
    };

    this.scatteredAttemptsDialog.open(JobScatteredAttemptsComponent, {
      disableClose: false,
      data: {
        shardsData: data
      }
    });
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
