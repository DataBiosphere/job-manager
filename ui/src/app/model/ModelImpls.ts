import {TaskMetadata} from './TaskMetadata';
import {JobStatus} from './JobStatus';
import {JobMetadataResponse} from './JobMetadataResponse';
import {QueryJobsResult} from './QueryJobsResult';
import {QueryJobsResponse} from './QueryJobsResponse';

/**
 * Implementations of interface models that need to be instantiated
 */
export class QueryJobResultImpl implements QueryJobsResult {
  id: string;
  name: string;
  status: JobStatus;
  start: Date;
}

export class QueryJobsResponseImpl implements QueryJobsResponse {
  results: QueryJobsResult[];
}

export class JobMetadataResponseImpl implements JobMetadataResponse {
  id: string;
  status: JobStatus;
  submission: Date;
  start?: Date;
  end?: Date;
  labels?: any;
  tasks?: Array<TaskMetadata>;
}

export class TaskMetadataImpl implements TaskMetadata {
  inputs: any;
  executionStatus: string;
  start?: Date;
  end?: Date;
  jobId?: string;
}
