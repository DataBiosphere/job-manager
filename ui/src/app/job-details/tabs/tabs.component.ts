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
import {GcsService} from "../../core/gcs.service";
import {ResourceUtils} from "../../shared/utils/resource-utils";
import {ErrorMessageFormatterPipe} from "../../shared/pipes/error-message-formatter.pipe";
import {MatSnackBar} from "@angular/material";

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

  constructor(
    private errorBar: MatSnackBar,
    private readonly gcsService: GcsService) {}

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

  navigateDown(id: string): void {
    if (id) {
      this.navDown.emit(id);
    }
  }

  previewFile() {
    const path = 'gs://fc-f7f94fee-8305-44fc-becc-19184f2c5ce6/3b1d5a62-b100-472b-9133-06170c1dfd69/funWorkflow/b749242a-54a3-4aa8-917f-2bfbb9aa93a8/call-simpleTask/simpleTask-stdout.log';
    console.log(path);
    this.readResourceFile(path).then(entries => {
      for (let data of entries.filter(e => !!e).sort()) {
        if (data) {
          console.log(data);
        }
      }
    });
  }

  private readResourceFile(file: string): Promise<[string, string]> {
    let bucket = ResourceUtils.getResourceBucket(file);
    let object = ResourceUtils.getResourceObject(file);
    return this.gcsService.readObject(bucket, object)
      .then(data => [file, data] as [string, string])
      .catch(error => this.handleError(error));
  }

  private handleError(error: any): any {
    this.errorBar.open(
      new ErrorMessageFormatterPipe().transform(error),
      'Dismiss',
      {
        duration: 3000,
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
