import {
  Component, Input, OnChanges, OnInit,
  SimpleChanges
} from '@angular/core';
import {TaskMetadata} from '../../model/TaskMetadata';
import {DataSource} from '@angular/cdk/collections';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';
import {Observable} from 'rxjs/Observable';
import {JobQueryRequest} from '../../model/JobQueryRequest';
import StatusesEnum = JobQueryRequest.StatusesEnum;
import {isNullOrUndefined} from 'util';

@Component({
  selector: 'tasks',
  templateUrl: './tasks.component.html',
  styleUrls: ['./tasks.component.css'],
})
export class TaskDetailsComponent implements OnInit, OnChanges {
  @Input() tasks: TaskMetadata[] = [];
  database = new TasksDatabase(this.tasks);
  dataSource: TasksDataSource | null;
  displayedColumns = [
    'name',
    'status',
    'shard',
    'label1',
    'label2',
  ];

  ngOnInit() {
    this.dataSource = new TasksDataSource(this.database);
  }

  ngOnChanges(changes: SimpleChanges) {
    this.tasks = changes.tasks.currentValue;
    this.database.dataChange.next(this.tasks);
  }

  getStatusUrl(status: string): string {
    switch(StatusesEnum[status]) {
      case StatusesEnum.Submitted:
        return "https://www.gstatic.com/images/icons/material/system/1x/file_upload_grey600_24dp.png";
      case StatusesEnum.Running:
        return "https://www.gstatic.com/images/icons/material/system/1x/autorenew_grey600_24dp.png";
      case StatusesEnum.Aborting:
        return "https://www.gstatic.com/images/icons/material/system/1x/report_problem_grey600_24dp.png";
      case StatusesEnum.Failed:
        return "https://www.gstatic.com/images/icons/material/system/1x/close_grey600_24dp.png";
      case StatusesEnum.Aborted:
        return "https://www.gstatic.com/images/icons/material/system/1x/report_problem_grey600_24dp.png";
      case StatusesEnum.Succeeded:
        return "https://www.gstatic.com/images/icons/material/system/1x/done_grey600_24dp.png";
    }
  }
}

/** Simple database an observable list of jobs to be subscribed to by the
 *  DataSource. */
export class TasksDatabase {
  private tasks: TaskMetadata[];
  /** Stream that emits whenever the data has been modified. */
  dataChange: BehaviorSubject<TaskMetadata[]> = new BehaviorSubject<TaskMetadata[]>(this.tasks);
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
      if (!isNullOrUndefined(this._db.data))
      return this._db.data.slice();
    });
  }

  disconnect() {}
}
