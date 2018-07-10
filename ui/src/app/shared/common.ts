/** A collection of enums and static functions. */
import {ClarityIcons} from "@clr/icons";

ClarityIcons.add({'queued': '<svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 177.7 200" style="enable-background:new 0 0 177.7 200;" xml:space="preserve"> <style type="text/css"> .st0{fill:#9B9B9B;} </style> <g> <path class="st0" d="M172.9,86.7c5.5,37-13.6,73.3-47.3,89.6s-74,8.8-99.6-18.5v33c0,3.1-2.6,5.7-5.7,5.7s-5.7-2.6-5.7-5.7v-51.3 h51.3c3.1,0,5.7,2.6,5.7,5.7c0,3.1-2.6,5.7-5.7,5.7H35.3c21,21.5,53,28.2,80.9,16.9s46.1-38.4,46.2-68.5c0-3.7-0.3-7.4-0.9-11 c-0.5-3.1,1.7-6.1,4.9-6.5S172.4,83.6,172.9,86.7z M157,2.8c3,0.2,5.4,2.7,5.4,5.7v51.3h-50.9c-3.1,0-5.7-2.6-5.7-5.7 c0-3.1,2.6-5.7,5.7-5.7h30.7c-13.9-14.8-33.4-23.2-53.8-23.1c-40.9,0-74.1,33.2-74.1,74.1c0,4.1,0.3,8.3,1,12.4 c0.5,3.1-1.6,6-4.7,6.6H9.7c-2.8,0-5.2-2-5.7-4.8c-0.8-4.7-1.1-9.4-1.1-14.1C2.7,64.1,24.3,32.4,57.1,19.6s70.2-4,93.9,22.1V8.5 C151.1,5.3,153.8,2.8,157,2.8z"/> <path class="st0" d="M101.8,72.6h7.6c5.2,0,9.5,4.3,9.5,9.5v34.7c0,5.2-4.3,9.5-9.5,9.5h-7.6c-5.2,0-9.5-4.3-9.5-9.5V82.1 C92.3,76.8,96.6,72.6,101.8,72.6z M65.9,72.6h7.6c5.2,0,9.5,4.3,9.5,9.5v34.7c0,5.2-4.3,9.5-9.5,9.5h-7.6c-5.2,0-9.5-4.3-9.5-9.5 V82.1C56.4,76.8,60.6,72.6,65.9,72.6z"/> </g> </svg>\n'});


/** Enum mapping of statuses and the clarity icon shapes representing with them. */
export enum JobStatusIcon {
  Submitted = 'minus',
  Running = 'sync',
  Aborting = 'exclamation-triangle',
  Failed = 'times',
  Succeeded = 'check',
  Aborted = 'exclamation-triangle',
  Queued = 'queued'
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
