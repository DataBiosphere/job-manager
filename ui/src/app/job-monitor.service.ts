// Data interface for listing jobs. This
// communicates via Angular's builtin Http module with a (fake) REST API.
import 'rxjs/add/operator/toPromise';
import {Injectable} from '@angular/core';
import {Headers, Http, RequestOptions} from '@angular/http';

import {
  Workflow, WorkflowAbortResponse, WorkflowQueryParameter,
  WorkflowQueryResponse
} from './models/workflow';

/** Service wrapper for accessing the job monitor API. */
@Injectable()
export class JobMonitorService {
  private apiUrl = '/v1';
  private headers = new Headers({'Content-Type': 'application/json'});

  constructor(private http: Http) {}

  listAllWorkflows(): Promise<WorkflowQueryResponse> {
    return this.http.get(`${this.apiUrl}/workflows`,
      new RequestOptions({headers: this.headers}))
      .toPromise()
      .then(response => response.json() as WorkflowQueryResponse)
      .catch(this.handleError);
  }

  abortWorkflow(id: string): Promise<WorkflowAbortResponse> {
    return this.http.get(`${this.apiUrl}/workflows/${id}/abort`,
      new RequestOptions({headers: this.headers}))
      .toPromise()
      .then(response => response.json() as WorkflowAbortResponse)
      .catch(this.handleError);
  }

  // TODO(alanhwang): Implement queryWorkflows

  private handleError(error: any): Promise<any> {
    // TODO(alanhwang): Implement real error handling.
    console.error('An error occurred', error);
    return Promise.reject(error.message || error);
  }
}
