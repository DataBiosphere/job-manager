import {BehaviorSubject} from 'rxjs/BehaviorSubject';
import {
  Component,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges
} from '@angular/core';
import {DataSource} from '@angular/cdk/collections';
import {Observable} from 'rxjs/Observable';

import {JobMetadataResponse} from '../../shared/model/JobMetadataResponse';
import {JobStatus} from '../../shared/model/JobStatus';
import {JobStatusIcon} from '../../shared/common';
import {ResourceUtils} from '../../shared/utils/resource-utils';
import {TaskMetadata} from '../../shared/model/TaskMetadata';
import {MatTabChangeEvent} from '@angular/material';

@Component({
  selector: 'jm-tasks',
  templateUrl: './tasks.component.html',
  styleUrls: ['./tasks.component.css'],
})
export class TaskDetailsComponent implements OnInit, OnChanges {
  @Input() tasks: TaskMetadata[] = [];
  @Input() job: JobMetadataResponse;

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

  ngOnInit() {
    this.dataSource = new TasksDataSource(this.database);
  }

  ngOnChanges(changes: SimpleChanges) {
    this.tasks = changes.tasks.currentValue;
    this.database.dataChange.next(this.tasks);
  }

  getStatusIcon(status: JobStatus): string {
    return JobStatusIcon[status];
  }

  getResourceUrl(url: string): string {
    return ResourceUtils.getResourceURL(url);
  }

  getTaskDirectory(task: TaskMetadata): string {
    if (task.callRoot) {
      return ResourceUtils.getDirectoryBrowserURL(task.callRoot);
    }
  }

  hasTimingUrl(): boolean {
    return this.job.extensions && !!this.job.extensions.timingUrl;
  }

  tabChanged(event: MatTabChangeEvent) {
    event.tab.isActive = false;
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
