import {MockBackend, MockConnection} from '@angular/http/testing';
import {ResponseOptions, Response} from '@angular/http';
import {QueryJobsResult} from './model/QueryJobsResult';
import {QueryJobsResponse} from './model/QueryJobsResponse';
import {QueryJobsRequest} from './model/QueryJobsRequest';
import {JobStatus} from './model/JobStatus';

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
        body = new QueryJobsResponseImpl();
        body.results = this.jobs.slice();
      }
      if (url.endsWith("abort")) {
        let job = this.jobs
          .find((j) => j.id.endsWith(url.split('/')[3]));
        if (!job) {
          c.mockRespond(new Response(new ResponseOptions({status: 404})));
          return;
        }
        this.jobs[this.jobs.indexOf(job)].status = JobStatus.Aborted;
        body = {};
      }
      c.mockRespond(new Response(new ResponseOptions({
        'status': 200,
        'body': body
      })));
    });
  }
}

class QueryJobsResponseImpl implements QueryJobsResponse {
  "results": QueryJobsResult[];
}

export function newDefaultMockJobMonitorService(): MockJobMonitorService {
  return new MockJobMonitorService(
    [
      { id: 'JOB1',
        name: 'TCG-NBL-7357',
        status: JobStatus.Running,
        start: new Date("11:44 PM Sep 9")},
      { id: 'JOB2',
        name: 'AML-G4-CHEN',
        status: JobStatus.Running,
        start: new Date("7:16 AM Sep 10")},
      { id: 'JOB3',
        name: 'TCG-NBL-B887',
        status: JobStatus.Running,
        start: new Date("8:50 AM Sep 10")},
      { id: 'JOB4',
        name: 'TARGET-CCSK',
        status: JobStatus.Running,
        start: new Date("9:15 AM Sep 10")},
      { id: 'JOB5',
        name: '1543LKF678',
        status: JobStatus.Running,
        start: new Date("9:38 AM Sep 10")},
      { id: 'JOB6',
        name: '1543LKF674',
        status: JobStatus.Submitted,
        start: new Date("8:04 PM Sep 9")},
      { id: 'JOB7',
        name: 'TCG-NBL-644C',
        status: JobStatus.Aborted,
        start: new Date("6:55 PM Sep 8"),
        end: new Date("8:48 PM Sep 8")},
      { id: 'JOB8',
        name: 'TCG-NBL-6588',
        status: JobStatus.Succeeded,
        start: new Date("11:36 PM Sep 9")},
      { id: 'JOB9',
        name: 'AML-B2-CHEN',
        status: JobStatus.Failed,
        start: new Date("6:45 PM Sep 10")},
    ]
  )
}
