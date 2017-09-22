import {MockBackend, MockConnection} from '@angular/http/testing';
import {ResponseOptions, Response} from '@angular/http';
import {JobAbortResponse} from './model/JobAbortResponse';
import {JobQueryResult} from './model/JobQueryResult';
import {JobQueryResponse} from './model/JobQueryResponse';
import {JobQueryRequest} from './model/JobQueryRequest';
import StatusesEnum = JobQueryRequest.StatusesEnum;

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
        body = new JobQueryResponseImpl();
        body.results = this.jobs.slice();
      }
      if (url.endsWith("abort")) {
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
      }
      c.mockRespond(new Response(new ResponseOptions({
        'status': 200,
        'body': body
      })));
    });
  }
}

class JobQueryResponseImpl implements JobQueryResponse {
  "results": JobQueryResult[];
}

class JobAbortResponseImpl implements JobAbortResponse {
  "id": string;
  "status": string;
}

export function newDefaultMockJobMonitorService(): MockJobMonitorService {
  return new MockJobMonitorService(
    [
      { id: 'JOB1',
        name: 'TCG-NBL-7357',
        status: StatusesEnum[StatusesEnum.Running],
        start: new Date("11:44 PM Sep 9")},
      { id: 'JOB2',
        name: 'AML-G4-CHEN',
        status: StatusesEnum[StatusesEnum.Running],
        start: new Date("7:16 AM Sep 10")},
      { id: 'JOB3',
        name: 'TCG-NBL-B887',
        status: StatusesEnum[StatusesEnum.Running],
        start: new Date("8:50 AM Sep 10")},
      { id: 'JOB4',
        name: 'TARGET-CCSK',
        status: StatusesEnum[StatusesEnum.Running],
        start: new Date("9:15 AM Sep 10")},
      { id: 'JOB5',
        name: '1543LKF678',
        status: StatusesEnum[StatusesEnum.Running],
        start: new Date("9:38 AM Sep 10")},
      { id: 'JOB6',
        name: '1543LKF674',
        status: StatusesEnum[StatusesEnum.Submitted],
        start: new Date("8:04 PM Sep 9")},
      { id: 'JOB7',
        name: 'TCG-NBL-644C',
        status: StatusesEnum[StatusesEnum.Aborted],
        start: new Date("6:55 PM Sep 8"),
        end: new Date("8:48 PM Sep 8")},
      { id: 'JOB8',
        name: 'TCG-NBL-6588',
        status: StatusesEnum[StatusesEnum.Succeeded],
        start: new Date("11:36 PM Sep 9")},
      { id: 'JOB9',
        name: 'AML-B2-CHEN',
        status: StatusesEnum[StatusesEnum.Failed],
        start: new Date("6:45 PM Sep 10")},
    ]
  )
}
