// Data interface for listing jobs. This
// communicates via Angular's builtin Http module with a (fake) REST API.
import 'rxjs/add/operator/toPromise';
import {Injectable} from '@angular/core';
import {Headers, Http, RequestOptions} from '@angular/http';
import {JobQueryResponse} from './model/JobQueryResponse';
import {JobAbortResponse} from './model/JobAbortResponse';

/** Service wrapper for accessing the job monitor API. */
@Injectable()
export class JobMonitorService {
  private apiUrl = '/v1';
  private headers = new Headers({'Content-Type': 'application/json'});

  constructor(private http: Http) {}

  listAllJobs(): Promise<JobQueryResponse> {
    return this.http.get(`${this.apiUrl}/jobs`,
      new RequestOptions({headers: this.headers}))
      .toPromise()
      .then(response => response.json() as JobQueryResponse)
      .catch(this.handleError);
  }

  abortJob(id: string): Promise<JobAbortResponse> {
    return this.http.get(`${this.apiUrl}/jobs/${id}/abort`,
      new RequestOptions({headers: this.headers}))
      .toPromise()
      .then(response => response.json() as JobAbortResponse)
      .catch(this.handleError);
  }

  // TODO(alanhwang): Implement queryJobs

  private handleError(error: any): Promise<any> {
    // TODO(alanhwang): Implement real error handling.
    console.error('An error occurred', error);
    return Promise.reject(error.message || error);
  }
}
