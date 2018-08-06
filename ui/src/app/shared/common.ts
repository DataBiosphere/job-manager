/** A collection of enums and static functions. */

/** Enum mapping of statuses and the clarity icon shapes representing with them. */
import {TimeFrame} from "./model/TimeFrame";

export enum JobStatusIcon {
  Submitted = 'minus',
  Running = 'sync',
  Aborting = 'exclamation-triangle',
  Failed = 'times',
  Succeeded = 'check',
  Aborted = 'exclamation-triangle',
  OnHold = 'pause'
}

// TODO(bryancrampton): We may want to move this to be part of
// CapabilitiesResponse so that the data type of common labels can be
// specified.
export enum FieldDataType {
  Date,
  Enum,
  Text
}

/** Constant strings for non-configurable primary fields that can be queried
 *  over. These should encompass all fields on QueryJobsRequest (besides
 *  pageSize and pageToken). */
export const queryDataTypes: Map<string, FieldDataType> = new Map([
  ['name', FieldDataType.Text],
  ['statuses', FieldDataType.Enum],
  ['start', FieldDataType.Date],
  ['end', FieldDataType.Date]
]);

export const queryExtensionsDataTypes: Map<string, FieldDataType> = new Map([
  ['projectId', FieldDataType.Text],
  ['userId', FieldDataType.Text],
  ['submission', FieldDataType.Date]
]);

export const timeFrameStringMap: Map<String, TimeFrame> = new Map([
  ['HOURS_1', TimeFrame.HOURS1],
  ['HOURS_8', TimeFrame.HOURS8],
  ['HOURS_24', TimeFrame.HOURS24],
  ['DAYS_7', TimeFrame.DAYS7],
  ['DAYS_30', TimeFrame.DAYS30],
  ['ALL_TIME', TimeFrame.ALLTIME],
]);

/** The page size to initially request from the backend. The maximum number of
 *  jobs on a page is 100, so request 100 initially. */
export const initialBackendPageSize = 100;

/**
 * The default time frame of jobs aggregation on dashboard page
 */
export const defaultTimeFrame = TimeFrame.DAYS7;
