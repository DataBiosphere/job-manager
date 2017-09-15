// A workflow with associated metadata.
export class Workflow {
  id: string;
  name: string;
  owner: string;
  status: Status;
  start: string;
  end?: string;
  labels?: object;
  comments: string;
}

export enum Status {
  submitted = 0,
  running = 1,
  paused = 2, // TODO(alanhwang): Add this to the API
  aborting = 3,
  failed = 4,
  succeeded = 5,
  aborted = 6
}

export class WorkflowAbortResponse {
  id: string;
  status: Status;
}

export class WorkflowMetadataResponse {
  id: string;
  status: string;
  submission: string;
  start?: string;
  end?: string;
  inputs?: object;
  outputs?: object;
  labels?: object;
  calls?: CallMetadata;
  failures?: FailureMessage[];
}

export class CallMetadata {
  inputs: object;
  executionStatus: string;
  start?: string;
  end?: string;
  jobId?: string;
  failures?: FailureMessage[];
  returnCode?: number;
  stdout?: string;
  stderr?: string;
}

export class FailureMessage {
  failure: string;
  timestamp: string;
}

export class WorkflowQueryParameter {
  start?: string;
  end?: string;
  status?: Status;
  name?: string;
  parentId?: string;
}

export class WorkflowQueryResponse {
  results: Workflow[];
}
