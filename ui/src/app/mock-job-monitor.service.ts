import {MockBackend, MockConnection} from '@angular/http/testing';
import {ResponseOptions, Response} from '@angular/http';
import {JobAbortResponse} from './model/JobAbortResponse';
import {JobQueryResult} from './model/JobQueryResult';
import {JobQueryResponse} from './model/JobQueryResponse';
import {JobQueryRequest} from './model/JobQueryRequest';
import StatusesEnum = JobQueryRequest.StatusesEnum;
import {JobMetadataResponse} from './model/JobMetadataResponse';
import {TaskMetadata} from './model/TaskMetadata';
import {FailureMessage} from './model/FailureMessage';

/**
* MockJobMonitorService implements an in-memory fake job monitor server via
* Angular's MockBackend.
*/
export class MockJobMonitorService {
  constructor(
    private jobs:JobQueryResult[],
  ){}

  subscribe(backend: MockBackend): void {
    backend.connections.subscribe((c: MockConnection) => {
      const url = c.request.url;
      let body;
      if (url == "/v1/jobs") {
        // listAllJobs
        body = new JobQueryResponseImpl();
        body.results = this.jobs.slice();
      }
      else if (url.endsWith("abort")) {
        // abortJob
        let job = this.jobs
          .find((j) => j.id.endsWith(url.split('/')[3]));
        if (!job) {
          c.mockRespond(new Response(new ResponseOptions({status: 404})));
          return;
        }
        this.jobs[this.jobs.indexOf(job)].status =
          StatusesEnum[StatusesEnum.Aborted];
        body = new JobAbortResponseImpl();
        body.id = job.id;
        body.status = job.status;
      } else if (url.startsWith("/v1/jobs/") && url.split('/').length == 4) {
        // getJob
        let job = this.jobs
          .find((j) => j.id == (url.split('/')[3]));
        if (!job) {
          c.mockRespond(new Response(new ResponseOptions({status: 404})));
          return;
        }
        body = new JobMetadataResponseImpl();
        body.id = job.id;
        body.name = job.name;
        body.status = job.status;
        body.submission = job.start;
        body.start = job.start;
        body.end = job.end;
        body.labels = job.labels;
        body.tasks = this.getTasks(job);
      }
      c.mockRespond(new Response(new ResponseOptions({
        'status': 200,
        'body': body
      })));
    });
  }

  private getTasks(job: JobQueryResult): TaskMetadataImpl[] {
      let tasks: TaskMetadataImpl[] = [];
      tasks.push(this.createTask(job.start, "Task 1", 15,
        StatusesEnum[StatusesEnum.Succeeded]));
      tasks.push(this.createTask(job.start, "Task 2", 30,
        StatusesEnum[StatusesEnum.Succeeded]));
      tasks.push(this.createTask(job.start, "Task 3", 45,
        job.status));
      tasks.push(this.createTask(job.start, "Task 4", 60,
        job.status));
      return tasks;
  }

  private createTask(start: Date, jobId: string, runTime: number,
                     executionStatus: string ): TaskMetadataImpl {
    let task: TaskMetadataImpl = new TaskMetadataImpl();
    task.inputs = "Inputs";
    task.executionStatus = executionStatus;
    task.jobId = jobId;
    task.start = start;
    if (executionStatus != StatusesEnum[StatusesEnum.Running]) {
      task.end = new Date(start.getMonth(), start.getDay(),
        start.getFullYear(), start.getHours()+1,
        start.getMinutes() + runTime, start.getSeconds());
    }
    return task;
  }
}

class JobQueryResultImpl implements JobQueryResult {
  id: string;
  name: string;
  status: string;
  start: Date;
}

class JobQueryResponseImpl implements JobQueryResponse {
  results: JobQueryResult[];
}

class JobAbortResponseImpl implements JobAbortResponse {
  id: string;
  status: string;
}

class JobMetadataResponseImpl implements JobMetadataResponse {
  id: string;
  name: string;
  status: string;
  submission: Date;
  start?: Date;
  end?: Date;
  labels?: any;
  tasks?: Array<TaskMetadata>;
}

class TaskMetadataImpl implements TaskMetadata {
  inputs: any;
  executionStatus: string;
  start?: Date;
  end?: Date;
  jobId?: string;
}

export function newDefaultMockJobMonitorService(): MockJobMonitorService {
  let jobTemplates: JobQueryResult[] =
    [
      { id: 'JOB1',
        name: 'TCG-NBL-7357',
        status: StatusesEnum[StatusesEnum.Running],
        start: new Date(new Date().getTime() - 1200000)},
      { id: 'JOB2',
        name: 'AML-G4-CHEN',
        status: StatusesEnum[StatusesEnum.Submitted],
        start: new Date(new Date().getTime() - 2200300)},
      { id: 'JOB3',
        name: 'TCG-NBL-B887',
        status: StatusesEnum[StatusesEnum.Running],
        start: new Date(new Date().getTime() - 7364000)},
      { id: 'JOB4',
        name: 'TARGET-CCSK',
        status: StatusesEnum[StatusesEnum.Running],
        start: new Date(new Date().getTime() - 9291800)},
      { id: 'JOB5',
        name: '1543LKF678',
        status: StatusesEnum[StatusesEnum.Running],
        start: new Date(new Date().getTime() - 6240000)},
      { id: 'JOB6',
        name: '1543LKF674',
        status: StatusesEnum[StatusesEnum.Submitted],
        start: new Date(new Date().getTime() - 800000)},
      { id: 'JOB7',
        name: 'TCG-NBL-644C',
        status: StatusesEnum[StatusesEnum.Aborted],
        start: new Date(new Date().getTime() - 21099000),
        end: new Date(new Date().getTime() - 25844000)},
      { id: 'JOB8',
        name: 'TCG-NBL-6588',
        status: StatusesEnum[StatusesEnum.Succeeded],
        start: new Date(new Date().getTime() - 11099000),
        end: new Date(new Date().getTime() - 15844000)},
      { id: 'JOB9',
        name: 'AML-B2-CHEN',
        status: StatusesEnum[StatusesEnum.Failed],
        start: new Date(new Date().getTime() - 10099000),
        end: new Date(new Date().getTime() - 11844000)},
    ];
  let mockJobs: JobQueryResult[] = [];
  for (let i = 0; i < 200; i++) {
    let job: JobQueryResult = new JobQueryResultImpl();
    Object.assign(job, jobTemplates[i%jobTemplates.length]);
    job.id = 'JOB'+ i;
    job.name += i;
    mockJobs.push(job)}
  return new MockJobMonitorService(mockJobs);
}
