import {MockBackend, MockConnection} from '@angular/http/testing';
import {ResponseOptions, Response} from '@angular/http';
import {QueryJobsResult} from './model/QueryJobsResult';
import {JobStatus} from './model/JobStatus';
import {
  JobMetadataResponseImpl, QueryJobResultImpl, QueryJobsResponseImpl,
  TaskMetadataImpl
} from './model/ModelImpls';

/**
* MockJobMonitorService implements an in-memory fake job monitor server via
* Angular's MockBackend.
*/
export class MockJobMonitorService {
  constructor(
    private jobs:QueryJobsResult[],
  ){}

  subscribe(backend: MockBackend): void {
    backend.connections.subscribe((c: MockConnection) => {
      const url = c.request.url;
      let body;
      if (url == "/v1/jobs") {
        // listAllJobs
        body = new QueryJobsResponseImpl();
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
          JobStatus.Aborted;
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

  private getTasks(job: QueryJobsResult): TaskMetadataImpl[] {
      let tasks: TaskMetadataImpl[] = [];
      tasks.push(this.createTask(job.start, "Task 1", 15,
        JobStatus[JobStatus.Aborted]));
      tasks.push(this.createTask(job.start, "Task 2", 30,
        JobStatus[JobStatus.Succeeded]));
      tasks.push(this.createTask(job.start, "Task 3", 45,
        JobStatus[job.status]));
      tasks.push(this.createTask(job.start, "Task 4", 60,
        JobStatus[job.status]));
      return tasks;
  }

  private createTask(start: Date, jobId: string, runTime: number,
                     executionStatus: string ): TaskMetadataImpl {
    let task: TaskMetadataImpl = new TaskMetadataImpl();
    task.inputs = "Inputs";
    task.executionStatus = executionStatus;
    task.jobId = jobId;
    task.start = start;
    if (executionStatus != JobStatus[JobStatus.Running]) {
      task.end = new Date(start.getMonth(), start.getDay(),
        start.getFullYear(), start.getHours()+1,
        start.getMinutes() + runTime, start.getSeconds());
    }
    return task;
  }
}

export function newDefaultMockJobMonitorService(): MockJobMonitorService {
  let jobTemplates: QueryJobsResult[] =
    [
      { id: 'JOB1',
        name: 'TCG-NBL-7357',
        status: JobStatus.Running,
        start: new Date(new Date().getTime() - 1200000)},
      { id: 'JOB2',
        name: 'AML-G4-CHEN',
        status: JobStatus.Submitted,
        start: new Date(new Date().getTime() - 2200300)},
      { id: 'JOB3',
        name: 'TCG-NBL-B887',
        status: JobStatus.Running,
        start: new Date(new Date().getTime() - 7364000)},
      { id: 'JOB4',
        name: 'TARGET-CCSK',
        status: JobStatus.Running,
        start: new Date(new Date().getTime() - 9291800)},
      { id: 'JOB5',
        name: '1543LKF678',
        status: JobStatus.Running,
        start: new Date(new Date().getTime() - 6240000)},
      { id: 'JOB6',
        name: '1543LKF674',
        status: JobStatus.Submitted,
        start: new Date(new Date().getTime() - 800000)},
      { id: 'JOB7',
        name: 'TCG-NBL-644C',
        status: JobStatus.Aborted,
        start: new Date(new Date().getTime() - 21099000),
        end: new Date(new Date().getTime() - 25844000)},
      { id: 'JOB8',
        name: 'TCG-NBL-6588',
        status: JobStatus.Succeeded,
        start: new Date(new Date().getTime() - 11099000),
        end: new Date(new Date().getTime() - 15844000)},
      { id: 'JOB9',
        name: 'AML-B2-CHEN',
        status: JobStatus.Failed,
        start: new Date(new Date().getTime() - 10099000),
        end: new Date(new Date().getTime() - 11844000)},
    ];
  let mockJobs: QueryJobsResult[] = [];
  for (let i = 0; i < 200; i++) {
    let job: QueryJobsResult = new QueryJobResultImpl();
    Object.assign(job, jobTemplates[i%jobTemplates.length]);
    job.id = 'JOB'+ i;
    job.name += i;
    mockJobs.push(job)}
  return new MockJobMonitorService(mockJobs);
}
