// Data interface for listing jobs. This
// communicates via Angular's builtin Http module with a (fake) REST API.
import 'rxjs/add/operator/toPromise';
import {Injectable} from '@angular/core';
import {Headers, Http, RequestOptions} from '@angular/http';
import {QueryJobsResponse} from './model/QueryJobsResponse';
import {JobMetadataResponse} from './model/JobMetadataResponse';

/** Service wrapper for accessing the job monitor API. */
@Injectable()
export class JobMonitorService {
  private apiUrl = '/api';
  private headers = new Headers({'Content-Type': 'application/json'});

  constructor(private http: Http) {}

  listJobs(parentId?: string): Promise<JobQueryResponse> {
    return this.http.post(
      `${this.apiUrl}/jobs/query`,
      {
        parentId: parentId,
      },
      new RequestOptions({
        headers: this.headers,
      }))
      .toPromise()
      .then(response => response.json() as QueryJobsResponse)
      .catch(this.handleError);
  }

  abortJob(id: string): Promise<boolean> {
    return this.http.get(`${this.apiUrl}/jobs/${id}/abort`,
      new RequestOptions({headers: this.headers}))
      .toPromise()
      .then(response => response.status == 200)
      .catch(this.handleError);
  }

  getJob(id: string): Promise<JobMetadataResponse> {
    return this.http.get(`${this.apiUrl}/jobs/${id}`,
      new RequestOptions({headers: this.headers}))
      .toPromise()
      .then(response => response.json() as JobMetadataResponse)
      .catch(this.handleError);
  }

  // TODO(alanhwang): Implement queryJobs

  private handleError(error: any): Promise<any> {
    // TODO(alahwa): Implement real error handling.
    console.error('An error occurred', error);
    return Promise.reject(error.message || error);
  }
}
