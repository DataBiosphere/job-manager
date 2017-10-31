import {BehaviorSubject} from 'rxjs/BehaviorSubject';

import {JobMonitorService} from '../core/job-monitor.service';
import {JobStatus, QueryJobsResponse, QueryJobsResult} from './model/models';
import {StatusGroup} from './common';

// An observable stream of the client's materialized jobs, where each update
// contains all jobs that have been loaded so far.
export class JobStream extends BehaviorSubject<JobListView> {
  private static readonly minBackendPageSize = 100;

  // A backend query promise which represents the pending or most recent backend
  // response. All requests synchronize through this promise to avoid duplicate
  // data loading.
  private queryPromise: Promise<QueryJobsResponse> = Promise.resolve({});

  constructor(private jobMonitorService: JobMonitorService,
              private statusGroup: StatusGroup,
              private parentId?: string) {
    super({
      results: [],
      exhaustive: false
    });
  }

  // Makes an API request if this JobStream doesn't have atLeast this many
  // total entries; no-op otherwise. The job stream may elect to load more than
  // the requested number.
  loadAtLeast(atLeast: number): void {
    this.queryPromise = this.queryPromise.then(prevResp => {
      if (this.value.exhaustive ||
        this.value.results.length >= atLeast) {
        // We've already loaded the requested number of jobs.
        return prevResp;
      }
      let pageSize = Math.max(
        JobStream.minBackendPageSize, this.value.results.length - atLeast);
      return this.queryJobs(pageSize, prevResp.nextPageToken).then(resp => {
        this.next({
          results: this.value.results.concat(resp.results),
          exhaustive: !resp.nextPageToken
        })
        return resp;
      });
    });
  }

  private queryJobs(pageSize: number, pageToken?: string): Promise<QueryJobsResponse> {
    return this.jobMonitorService.queryJobs({
      parentId: this.parentId,
      statuses: this.statusGroupToJobStatuses(this.statusGroup),
      pageSize: pageSize,
      pageToken: pageToken
    });
  }

  private statusGroupToJobStatuses(statusGroup: StatusGroup): JobStatus[] {
    switch(statusGroup) {
      case StatusGroup.Active: {
        return [JobStatus.Submitted, JobStatus.Running, JobStatus.Aborting];
      }
      case StatusGroup.Completed: {
        return [JobStatus.Succeeded, JobStatus.Aborted];
      }
      case StatusGroup.Failed: {
        return [JobStatus.Failed];
      }
      default: {
        return [];
      }
    }
  }
}


// A view of a logical list of jobs, typically coresponding to a particular
// API query. This may only be a partial view of a larger job list, as indicated
// by the exhaustive flag.
export type JobListView = {
  results: QueryJobsResult[];
  exhaustive: boolean;
}
