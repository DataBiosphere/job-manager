import {HttpHeaders, HttpClient, HttpErrorResponse} from '@angular/common/http';
import {Injectable} from '@angular/core';

import {AuthService} from './auth.service';
import {QueryJobsRequest} from '../shared/model/QueryJobsRequest';
import {QueryJobsResponse} from '../shared/model/QueryJobsResponse';
import {JobMetadataResponse} from '../shared/model/JobMetadataResponse';
import {UpdateJobLabelsRequest} from "../shared/model/UpdateJobLabelsRequest";
import {UpdateJobLabelsResponse} from "../shared/model/UpdateJobLabelsResponse";
import {TimeFrame, AggregationResponse, JobAttemptsResponse, JobOperationResponse} from '../shared/model/models';

import {ConfigLoaderService} from "../../environments/config-loader.service";

/** Service wrapper for accessing the job manager API. */
@Injectable()
export class JobManagerService {

  private static readonly defaultErrorDetail = "An unknown error has occurred. Please try again later.";
  private static readonly defaultErrorTitle = "Unknown";

  constructor(private readonly authService: AuthService, private http: HttpClient,
              private configLoader:ConfigLoaderService) {}

  private convertToJobMetadataResponse(json: object): JobMetadataResponse {
    let metadata: JobMetadataResponse = json as JobMetadataResponse;
    metadata.submission = new Date(metadata.submission);
    if (metadata.start) {
      metadata.start = new Date(metadata.start);
    }
    if (metadata.end) {
      metadata.end = new Date(metadata.end);
    }
    if (metadata.extensions) {
      if (metadata.extensions.tasks) {
        metadata.extensions.tasks.forEach((t) => {
          if (t.start) {
            t.start = new Date(t.start);
          }
          if (t.end) {
            t.end = new Date(t.end);
          }
          return t;
        });
      }
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
        result.end = new Date(result.end);
      }
    }
    return response;
  }

  private convertToAggregationJobsResponse(json: object): AggregationResponse {
    let response: AggregationResponse = json as AggregationResponse;
    //TODO(zach): convert potentially incompatible object to models
    return response;
  }

  private getErrorTitle(response: HttpErrorResponse): string {
    if (response.name) {
      return response.name;
    }
    return response.statusText ? response.statusText : JobManagerService.defaultErrorTitle;
  }

  private getErrorDetail(response: HttpErrorResponse): string {
    return response.message ? response.message : JobManagerService.defaultErrorDetail;
  }

  private getHttpHeaders(): HttpHeaders {
    var headers = new HttpHeaders({'Content-Type': 'application/json'});
    if (this.authService.authToken) {
      headers.set('Authentication', `Bearer ${this.authService.authToken}`);
    }
    return headers;
  }

  private handleError(response: HttpErrorResponse): Promise<any> {
    return Promise.reject({
      status: response.status,
      title: this.getErrorTitle(response),
      message: this.getErrorDetail(response),
    });
  }

  abortJob(id: string): Promise<void> {
    const apiUrl = this.configLoader.getEnvironmentConfigSynchronous()['apiUrl'];
    return this.http.post(`${apiUrl}/jobs/${id}/abort`,
      {},
      {
        headers: this.getHttpHeaders(), 
        observe: 'response'
      })
      .toPromise()
      .then(response => response.status == 200)
      .catch((e) => this.handleError(e));
  }

  updateJobLabels(id: string, req: UpdateJobLabelsRequest): Promise<UpdateJobLabelsResponse> {
    const apiUrl = this.configLoader.getEnvironmentConfigSynchronous()['apiUrl'];
    return this.http.post(`${apiUrl}/jobs/${id}/updateLabels`,
      req,
      {headers: this.getHttpHeaders()})
      .toPromise()
      .catch((e) => this.handleError(e));
  }

  getJob(id: string): Promise<JobMetadataResponse> {
    const apiUrl = this.configLoader.getEnvironmentConfigSynchronous()['apiUrl'];
    return this.http.get(`${apiUrl}/jobs/${id}`,
      {headers: this.getHttpHeaders()})
      .toPromise()
      .then(response => this.convertToJobMetadataResponse(response))
      .catch((e) => this.handleError(e));
  }

  // TODO(calbach): Evaluate whether this should use an Observable instead for
  // consistency with other ng2 APIs, in addition to the retry/cancel
  // capabilities.
  queryJobs(req: QueryJobsRequest): Promise<QueryJobsResponse> {
    const apiUrl = this.configLoader.getEnvironmentConfigSynchronous()['apiUrl'];
    return this.http.post(`${apiUrl}/jobs/query`,
      req,
      {headers: this.getHttpHeaders()})
      .toPromise()
      .then(response => this.convertToQueryJobsResponse(response))
      .catch((e) => this.handleError(e));
  }

  queryAggregations(timeFrame: TimeFrame, projectId: string): Promise<AggregationResponse> {
    const apiUrl = this.configLoader.getEnvironmentConfigSynchronous()['apiUrl'];
    return this.http.get(`${apiUrl}/aggregations`,
      {
        params: {
          projectId,
          timeFrame
        },
        headers: this.getHttpHeaders()
      })
      .toPromise()
      .then(response => this.convertToAggregationJobsResponse(response))
      .catch((e) => this.handleError(e));
  }

  getTaskAttempts(id:string, task:string): Promise<JobAttemptsResponse> {
    const apiUrl = this.configLoader.getEnvironmentConfigSynchronous()['apiUrl'];
    return this.http.get(`${apiUrl}/jobs/${id}/${task}/attempts`,
      {headers: this.getHttpHeaders()})
      .toPromise()
      .catch((e) => this.handleError(e));
  }

  getShardAttempts(id:string, task:string, index:number): Promise<JobAttemptsResponse> {
    const apiUrl = this.configLoader.getEnvironmentConfigSynchronous()['apiUrl'];
    return this.http.get(`${apiUrl}/jobs/${id}/${task}/${index}/attempts`,
      {headers: this.getHttpHeaders()})
      .toPromise()
      .catch((e) => this.handleError(e));
  }
}
