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

/** Constant strings for non-configurable primary fields that can be queried over. Each should have a corresponding
 *  field on QueryJobsRequest. */
export const QueryFields = {
  parentId: 'parent-id',
  jobName: 'job-name',
  statuses: 'statuses',
  start: 'start',
  end: 'end',
}

/** The list of non-configurable primary columns that can be displayed and queried over. */
export const PRIMARY_COLUMNS: string[] = [
  'Job',
  'Status',
  'Submitted',
];
