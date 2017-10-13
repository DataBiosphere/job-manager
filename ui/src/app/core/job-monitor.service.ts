import {Headers, Http, RequestOptions} from '@angular/http';
import {Injectable} from '@angular/core';
import 'rxjs/add/operator/toPromise';

import {environment} from '../../environments/environment';
import {QueryJobsRequest} from '../shared/model/QueryJobsRequest';
import {QueryJobsResponse} from '../shared/model/QueryJobsResponse';
import {JobMetadataResponse} from '../shared/model/JobMetadataResponse';


/** Service wrapper for accessing the job monitor API. */
@Injectable()
export class JobMonitorService {
  private headers = new Headers({'Content-Type': 'application/json'});

  constructor(private http: Http) {}

  private convertToJobMetadataResponse(json: object): JobMetadataResponse {
    var metadata: JobMetadataResponse = json as JobMetadataResponse;
    metadata.submission = new Date(metadata.submission);
    if (metadata.start) {
      metadata.start = new Date(metadata.start);
    }
    if (metadata.end) {
      metadata.end = new Date(metadata.end);
    }
    return metadata;
  }

  private convertToQueryJobsResponse(json: object): QueryJobsResponse {
    var response: QueryJobsResponse = json as QueryJobsResponse;
    for (var result of response.results) {
      result.submission = new Date(result.submission);
      if (result.start) {
        result.start = new Date(result.start);
      }
      if (result.end) {
        result.submission = new Date(result.end);
      }
    }
    return response;
  }

  private handleError(error: any): Promise<any> {
    // TODO(alahwa): Implement real error handling.
    console.error('An error occurred', error);
    return Promise.reject(error.message || error);
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
      .then(response => this.convertToJobMetadataResponse(response.json()))
      .catch(this.handleError);
  }

  queryJobs(req: QueryJobsRequest): Promise<QueryJobsResponse> {
    return this.http.post(
      `${environment.apiUrl}/jobs/query`,
      req,
      new RequestOptions({
        headers: this.headers,
      }))
      .toPromise()
      .then(response => this.convertToQueryJobsResponse(response.json()))
      .catch(this.handleError);
  }
}
