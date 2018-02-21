/** A collection of enums and static functions. */

/** Enum mapping of statuses and the app-wide icons representing with them. */
export enum JobStatusImage {
  Submitted = <any> 'https://www.gstatic.com/images/icons/material/system/1x/remove_grey600_24dp.png',
  Running = <any> 'https://www.gstatic.com/images/icons/material/system/1x/autorenew_grey600_24dp.png',
  Aborting = <any> 'https://www.gstatic.com/images/icons/material/system/1x/report_problem_grey600_24dp.png',
  Failed = <any> 'https://www.gstatic.com/images/icons/material/system/1x/close_grey600_24dp.png',
  Succeeded = <any> 'https://www.gstatic.com/images/icons/material/system/1x/done_grey600_24dp.png',
  Aborted = <any> 'https://www.gstatic.com/images/icons/material/system/1x/report_problem_grey600_24dp.png'
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

/** The page size to initially request from the backend. The maximum number of
 *  jobs on a page is 100, so request 100 initially. */
export const initialBackendPageSize = 100;
