import {Headers, Http, RequestOptions} from '@angular/http';
import {Injectable} from '@angular/core';
import 'rxjs/add/operator/toPromise';

import {AuthService} from './auth.service';
import {environment} from '../../environments/environment';
import {QueryJobsRequest} from '../shared/model/QueryJobsRequest';
import {QueryJobsResponse} from '../shared/model/QueryJobsResponse';
import {JobMetadataResponse} from '../shared/model/JobMetadataResponse';


/** Service wrapper for accessing the job monitor API. */
@Injectable()
export class JobMonitorService {

  private static readonly defaultErrorDetail = "An unknown error has ocurred. Please try again later."
  private static readonly defaultErrorTitle = "Unknown"

  constructor(private readonly authService: AuthService, private http: Http) {}

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

  private getErrorTitle(response: any): string {
    let json = response.json();
    if ("title" in json && json["title"]) {
      return json["title"];
    } else {
      return response.statusText ? response.statusText : JobMonitorService.defaultErrorTitle;
    }
  }

  private getErrorDetail(response: any): string {
    let json = response.json();
    return "detail" in json && json["detail"] ? json["detail"] : JobMonitorService.defaultErrorDetail;
  }

  private getHttpHeaders(): Headers {
    var headers = new Headers({'Content-Type': 'application/json'});
    if (environment.requiresAuth && this.authService.authToken) {
      headers.set('Authentication', `Bearer ${this.authService.authToken}`);
    }
    return headers;
  }

  private handleError(response: any): Promise<any> {
    return Promise.reject({
      "status": response["status"],
      "title": this.getErrorTitle(response),
      "message": this.getErrorDetail(response),
    });
  }

  abortJob(id: string): Promise<void> {
    return this.http.post(`${environment.apiUrl}/jobs/${id}/abort`,
      {},
      new RequestOptions({headers: this.getHttpHeaders()}))
      .toPromise()
      .then(response => response.status == 200)
      .catch((e) => this.handleError(e));
  }

  getJob(id: string): Promise<JobMetadataResponse> {
    return this.http.get(`${environment.apiUrl}/jobs/${id}`,
      new RequestOptions({headers: this.getHttpHeaders()}))
      .toPromise()
      .then(response => this.convertToJobMetadataResponse(response.json()))
      .catch((e) => this.handleError(e));
  }

  // TODO(calbach): Evaluate whether this should use an Observable instead for
  // consistency with other ng2 APIs, in addition to the retry/cancel
  // capabilities.
  queryJobs(req: QueryJobsRequest): Promise<QueryJobsResponse> {
    return this.http.post(`${environment.apiUrl}/jobs/query`,
      req,
      new RequestOptions({headers: this.getHttpHeaders()}))
      .toPromise()
      .then(response => this.convertToQueryJobsResponse(response.json()))
      .catch((e) => this.handleError(e));
  }
}
