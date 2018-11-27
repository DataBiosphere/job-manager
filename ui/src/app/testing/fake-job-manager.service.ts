import {JobStatus} from '../shared/model/JobStatus';
import {JobMetadataResponse} from '../shared/model/JobMetadataResponse';
import {QueryJobsResult} from '../shared/model/QueryJobsResult';
import {JobManagerService} from '../core/job-manager.service';
import {QueryJobsRequest} from '../shared/model/QueryJobsRequest';
import {QueryJobsResponse} from '../shared/model/QueryJobsResponse';

export class FakeJobManagerService extends JobManagerService {
  constructor(public jobs: QueryJobsResult[]) {
    super(null, null, null);
  }

  private findJob(id: string): QueryJobsResult {
    return this.jobs.find(j => j.id === id);
  }

  private cloneJob(j: QueryJobsResult): QueryJobsResult {
    // Low effort mechanism to clone all properties. Date types don't get
    // preserved during this process, so add these explicitly after.
    const clone: QueryJobsResult = JSON.parse(JSON.stringify(j));
    return {
      ...clone,
      submission: new Date(j.submission),
      start: new Date(j.start),
      end: new Date(j.end)
    }
  }

  abortJob(id: string): Promise<void> {
    const j = this.findJob(id);
    if (!j) {
      return Promise.reject(Error('not found'))
    }
    return new Promise(resolve => {
      // Mutate the job status asynchronously to simulate the remote call.
      setTimeout(() => {
        j.status = JobStatus.Aborted;
        resolve();
      }, 0);
    })
  }

  getJob(id: string): Promise<JobMetadataResponse> {
    const j = this.findJob(id);
    if (!j) {
      return Promise.reject(Error('not found'))
    }
    return Promise.resolve({
      id: j.id,
      name: j.name,
      status: j.status,
      submission: j.submission,
      start: j.start,
      end: j.end,
      labels: j.labels,
      tasks: []
    });
  }

  queryJobs(req: QueryJobsRequest): Promise<QueryJobsResponse> {
    const statuses: Set<JobStatus> = new Set(req.status);
    return Promise.resolve({
      results: this.jobs
        .filter(j => {
          if (req.status) {
            return statuses.has(j.status);
          }
          return true;
        })
        .map(j => this.cloneJob(j))
    });
  }
}
