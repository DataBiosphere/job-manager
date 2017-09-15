import {MockBackend, MockConnection} from '@angular/http/testing';
import {ResponseOptions, Response} from '@angular/http';

import {
  Workflow, Status, WorkflowQueryResponse,
  WorkflowAbortResponse
} from './models/workflow';
/**
* MockJobMonitorService implements an in-memory fake data explorer index
* server via Angular's MockBackend.
*/
export class MockJobMonitorService {
  constructor(
    private workflows:Workflow[],
  ){}

  subscribe(backend: MockBackend): void {
    backend.connections.subscribe((c: MockConnection) => {
      const url = c.request.url;
      let body;
      if (url == "/v1/workflows") {
        body = new WorkflowQueryResponse();
        body.results = this.workflows.slice();
      }
      if (url.endsWith("abort")) {
        let workflow = this.workflows
          .find((w) => w.id.endsWith(url.split('/')[3]));
        if (!workflow) {
          c.mockRespond(new Response(new ResponseOptions({status: 404})));
          return;
        }
        this.workflows[this.workflows.indexOf(workflow)].status =
          Status.aborted;
        body = new WorkflowAbortResponse();
        body.id = workflow.id;
        body.status = workflow.status;
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
      { id: 'WF1',
        name: 'TCG-NBL-7357',
        owner: 'mrankin',
        status: Status.running,
        start: "11:44 PM Sep 9",
        comments: ""},
      { id: 'WF2',
        name: 'AML-G4-CHEN',
        owner: 'jchen',
        status: Status.running,
        start: "7:16 AM",
        comments: ""},
      { id: 'WF3',
        name: 'TCG-NBL-B887',
        owner: 'mrankin',
        status: Status.running,
        start: "8:50 AM",
        comments: "Lorem ipsum dolor sit amet, consectetur adipiscing elit."},
      { id: 'WF4',
        name: 'TARGET-CCSK',
        owner: 'obrenborn',
        status: Status.paused,
        start: "9:15 AM",
        comments: "Phasellus in eros eu nibh venenatis faucibus."},
      { id: 'WF5',
        name: '1543LKF678',
        owner: 'jsweentz',
        status: Status.paused,
        start: "9:38 AM",
        comments: ""},
      { id: 'WF6',
        name: '1543LKF674',
        owner: 'jsweentz',
        status: Status.submitted,
        start: "8:04 PM Sep 9",
        comments: "Duis id pulvinar nisl."},
      { id: 'WF7',
        name: 'TCG-NBL-644C',
        owner: 'jsweentz',
        status: Status.aborted,
        start: "6:55 PM Sep 8",
        end: "8:48 PM Sep 8",
        comments: "Vivamus varius id orci vitae malesuada."},
      { id: 'WF8',
        name: 'TCG-NBL-6588',
        owner: 'jsweentz',
        status: Status.succeeded,
        start: "11:36 PM Sep 9",
        comments: "Quisque velit elit, sagittis eu arcu at, aliquam."},
      { id: 'WF9',
        name: 'AML-B2-CHEN',
        owner: 'jchen',
        status: Status.failed,
        start: "6:45 PM",
        comments: ""},
    ]
  )
}
