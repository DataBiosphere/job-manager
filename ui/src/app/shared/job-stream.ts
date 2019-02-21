import {BehaviorSubject} from 'rxjs/BehaviorSubject';

import {JobManagerService} from '../core/job-manager.service';
import {QueryJobsResponse, QueryJobsResult} from './model/models';
import {QueryJobsRequest} from "./model/QueryJobsRequest";
import {initialBackendPageSize} from "./common";

// An observable stream of the client's materialized jobs, where each update
// contains all jobs that have been loaded so far.
export class JobStream extends BehaviorSubject<JobListView> {
  private static readonly minBackendPageSize = initialBackendPageSize;

  // A backend query promise which represents the pending or most recent backend
  // response. All requests synchronize through this promise to avoid duplicate
  // data loading.
  private queryPromise: Promise<QueryJobsResponse> = Promise.resolve({results: []});

  // This class handles pagination, so the request's paging info need not be defined.
  constructor(private jobManagerService: JobManagerService,
              private request: QueryJobsRequest) {
    super({
      results: [],
      totalSize: undefined,
      exhaustive: false,
      stale: false
    });
  }

  // Makes an API request if this JobStream doesn't have atLeast this many
  // total entries; no-op otherwise. The job stream may elect to load more than
  // the requested number.
  public loadAtLeast(atLeast: number): Promise<any> {
    this.queryPromise = this.queryPromise.then(prevResp => {
      if (this.value.exhaustive ||
        this.value.results.length >= atLeast) {
        // We've already loaded the requested number of jobs.
        return prevResp;
      }
      let pageSize = Math.max(
        JobStream.minBackendPageSize, atLeast - this.value.results.length);
      return this.queryJobs(pageSize, prevResp.nextPageToken).then(resp => {
        this.next({
          results: this.value.results.concat(resp.results),
          totalSize: resp.totalSize,
          exhaustive: !resp.nextPageToken,
          stale: false
        });
        return resp;
      });
    });
    return this.queryPromise;
  }

  public setStale(): void {
    this.next({
      results: this.value.results,
      totalSize: this.value.totalSize,
      exhaustive: this.value.exhaustive,
      stale: true
    });
  }

  private queryJobs(pageSize: number, pageToken?: string): Promise<QueryJobsResponse> {
    this.request.pageSize = pageSize;
    this.request.pageToken = pageToken;
    return this.jobManagerService.queryJobs(this.request);
  }
}


// A view of a logical list of jobs, typically corresponding to a particular
// API query. This may only be a partial view of a larger job list, as indicated
// by the exhaustive flag.
export type JobListView = {
  results: QueryJobsResult[];
  totalSize: number|undefined;
  exhaustive: boolean;
  stale: boolean;
}
