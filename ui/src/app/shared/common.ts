/** A collection of enums and static functions. */

/** Enum mapping of statuses and the clarity icon shapes representing with them. */

import {TimeFrame} from "./model/TimeFrame";

export const STORAGE_REF = 'storage-ref';

export enum JobStatusIcon {
  Submitted = 'minus',
  Running = 'sync',
  Aborting = 'sync',
  Failed = 'error-standard',
  Succeeded = 'success-standard',
  Aborted = 'times-circle',
  OnHold = 'minus-circle'
}

// TODO(bryancrampton): We may want to move this to be part of
// CapabilitiesResponse so that the data type of common labels can be
// specified.
export enum FieldDataType {
  Date,
  Enum,
  Text,
  Boolean
}

/** Constant strings for non-configurable primary fields that can be queried
 *  over. These should encompass all fields on QueryJobsRequest (besides
 *  pageSize and pageToken). */
export const queryDataTypes: Map<string, FieldDataType> = new Map([
  ['id', FieldDataType.Text],
  ['name', FieldDataType.Text],
  ['status', FieldDataType.Enum],
  ['start', FieldDataType.Date],
  ['end', FieldDataType.Date],
  ['submission', FieldDataType.Date]
]);

export const queryExtensionsDataTypes: Map<string, FieldDataType> = new Map([
  ['projectId', FieldDataType.Text],
  ['userId', FieldDataType.Text],
  ['hideArchived', FieldDataType.Boolean]
]);

export const timeFrameToDescriptionMap = new Map<TimeFrame, string> ([
  [TimeFrame.HOURS1, 'Past hour'],
  [TimeFrame.HOURS8, 'Past 8 hours'],
  [TimeFrame.HOURS24, 'Past 24 hours'],
  [TimeFrame.DAYS7, 'Past 7 days'],
  [TimeFrame.DAYS30, 'Past 30 days'],
  [TimeFrame.ALLTIME, 'All time'],
]);

/**
 * The default time frame of jobs aggregation on dashboard page
 */
export const defaultTimeFrame = TimeFrame.DAYS7;


/** The page size to initially request from the backend. The maximum number of
 *  jobs on a page is 100, so request 100 initially. */
export const initialBackendPageSize = 100;
