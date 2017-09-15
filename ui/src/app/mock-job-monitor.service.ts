import {MockBackend, MockConnection} from '@angular/http/testing';
import {ResponseOptions, Response} from '@angular/http';

import {
  Job, Status, JobQueryResponse,
  JobAbortResponse
} from './models/job';
/**
* MockJobMonitorService implements an in-memory fake job monitor server via
* Angular's MockBackend.
*/
export class MockJobMonitorService {
  constructor(
    private jobs:Job[],
  ){}

  subscribe(backend: MockBackend): void {
    backend.connections.subscribe((c: MockConnection) => {
      const url = c.request.url;
      let body;
      if (url == "/v1/jobs") {
        body = new JobQueryResponse();
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
          Status.aborted;
        body = new JobAbortResponse();
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

export function newDefaultMockJobMonitorService(): MockJobMonitorService {
  return new MockJobMonitorService(
    [
      { id: 'JOB1',
        name: 'TCG-NBL-7357',
        owner: 'mrankin',
        status: Status.running,
        start: "11:44 PM Sep 9",
        comments: ""},
      { id: 'JOB2',
        name: 'AML-G4-CHEN',
        owner: 'jchen',
        status: Status.running,
        start: "7:16 AM",
        comments: ""},
      { id: 'JOB3',
        name: 'TCG-NBL-B887',
        owner: 'mrankin',
        status: Status.running,
        start: "8:50 AM",
        comments: "Lorem ipsum dolor sit amet, consectetur adipiscing elit."},
      { id: 'JOB4',
        name: 'TARGET-CCSK',
        owner: 'obrenborn',
        status: Status.paused,
        start: "9:15 AM",
        comments: "Phasellus in eros eu nibh venenatis faucibus."},
      { id: 'JOB5',
        name: '1543LKF678',
        owner: 'jsweentz',
        status: Status.paused,
        start: "9:38 AM",
        comments: ""},
      { id: 'JOB6',
        name: '1543LKF674',
        owner: 'jsweentz',
        status: Status.submitted,
        start: "8:04 PM Sep 9",
        comments: "Duis id pulvinar nisl."},
      { id: 'JOB7',
        name: 'TCG-NBL-644C',
        owner: 'jsweentz',
        status: Status.aborted,
        start: "6:55 PM Sep 8",
        end: "8:48 PM Sep 8",
        comments: "Vivamus varius id orci vitae malesuada."},
      { id: 'JOB8',
        name: 'TCG-NBL-6588',
        owner: 'jsweentz',
        status: Status.succeeded,
        start: "11:36 PM Sep 9",
        comments: "Quisque velit elit, sagittis eu arcu at, aliquam."},
      { id: 'JOB9',
        name: 'AML-B2-CHEN',
        owner: 'jchen',
        status: Status.failed,
        start: "6:45 PM",
        comments: ""},
    ]
  )
}
