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

import {JobStatus} from '../../shared/model/JobStatus';
import {JobStatusImage} from '../../shared/common';
import {TaskMetadata} from '../../shared/model/TaskMetadata';

@Component({
  selector: 'jm-tasks',
  templateUrl: './tasks.component.html',
  styleUrls: ['./tasks.component.css'],
})
export class TaskDetailsComponent implements OnInit, OnChanges {
  @Input() tasks: TaskMetadata[] = [];
  browserPrefix: string = "https://console.cloud.google.com/storage/browser/";
  database = new TasksDatabase(this.tasks);
  dataSource: TasksDataSource | null;
  displayedColumns = [
    'name',
    'status',
    'startTime',
    'duration',
    'attempts',
    'stdout',
    'stderr'
  ];

  ngOnInit() {
    this.dataSource = new TasksDataSource(this.database);
  }

  ngOnChanges(changes: SimpleChanges) {
    this.tasks = changes.tasks.currentValue;
    this.database.dataChange.next(this.tasks);
  }

  getStatusUrl(status: JobStatus): string {
    return JobStatusImage[status];
  }

  getDuration(task: TaskMetadata): String {
    let duration: number;
    if (task.end) {
      duration = task.end.getTime() - task.start.getTime();
    } else {
      duration = new Date().getTime() - task.start.getTime();
    }
    return Math.round(duration/3600000) + "h " +
      Math.round(duration/60000)%60 + "m";
  }

  getResourceBrowserURL(uri: string): string {
    let parts = this.validateGcsURLGetParts(uri);
    // This excludes the object from the link to show the enclosing directory.
    // This is valid with wildcard glob (bucket/path/*) and directories
    // (bucket/path/dir/) as well, the * or empty string will be trimmed.
    return parts ? this.browserPrefix + parts.slice(2,-1).join("/") : undefined;
  }

  private validateGcsURLGetParts(url: string): string[] {
    if (typeof(url) !== 'string') {
      return;
    }
    let parts = url.split("/");
    if (parts[0] != "gs:" || parts[1] != "") {
      // TODO(bryancrampton): Handle invalid resource URL gracefully
      return;
    }
    return parts;
  }

  formatValue(value: string): string {
    let parts = this.validateGcsURLGetParts(value);
    let formattedValue = value;
    if (parts) {
      // display the file name instead of the full resourceURL
      formattedValue = parts[parts.length -1];
    }
    return formattedValue;
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
