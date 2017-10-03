// Data interface for listing jobs. This
// communicates via Angular's builtin Http module with a (fake) REST API.
import 'rxjs/add/operator/toPromise';
import {Injectable} from '@angular/core';
import {Headers, Http, RequestOptions} from '@angular/http';
import {QueryJobsRequest} from './model/QueryJobsRequest';
import {QueryJobsResponse} from './model/QueryJobsResponse';
import {JobMetadataResponse} from './model/JobMetadataResponse';
import {environment} from '../environments/environment';

/** Service wrapper for accessing the job monitor API. */
@Injectable()
export class JobMonitorService {
  private headers = new Headers({'Content-Type': 'application/json'});

  constructor(private http: Http) {}

  queryJobs(req: QueryJobsRequest): Promise<QueryJobsResponse> {
    return this.http.post(
      `${environment.apiUrl}/jobs/query`,
      req,
      new RequestOptions({
        headers: this.headers,
      }))
      .toPromise()
      .then(response => response.json() as QueryJobsResponse)
      .catch(this.handleError);
  }

  abortJob(id: string): Promise<void> {
    return this.http.post(`${environment.apiUrl}/jobs/${id}/abort`,
      new RequestOptions({headers: this.headers}))
      .toPromise()
      .then(response => response.status == 200)
      .catch(this.handleError);
  }

  getJob(id: string): Promise<JobMetadataResponse> {
    return this.http.get(`${environment.apiUrl}/jobs/${id}`,
      new RequestOptions({headers: this.headers}))
      .toPromise()
      .then(response => response.json() as JobMetadataResponse)
      .catch(this.handleError);
  }

  private handleError(error: any): Promise<any> {
    // TODO(alahwa): Implement real error handling.
    console.error('An error occurred', error);
    return Promise.reject(error.message || error);
  }
}
