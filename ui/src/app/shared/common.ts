/** A collection of enums and static functions. */

export enum JobStatusImage {
  Submitted = <any> 'https://www.gstatic.com/images/icons/material/system/1x/file_upload_grey600_24dp.png',
  Running = <any> 'https://www.gstatic.com/images/icons/material/system/1x/autorenew_grey600_24dp.png',
  Aborting = <any> 'https://www.gstatic.com/images/icons/material/system/1x/report_problem_grey600_24dp.png',
  Failed = <any> 'https://www.gstatic.com/images/icons/material/system/1x/close_grey600_24dp.png',
  Succeeded = <any> 'https://www.gstatic.com/images/icons/material/system/1x/done_grey600_24dp.png',
  Done = <any> 'https://www.gstatic.com/images/icons/material/system/1x/done_grey600_24dp.png',
  Aborted = <any> 'https://www.gstatic.com/images/icons/material/system/1x/report_problem_grey600_24dp.png'
}

export enum StatusGroup {
  Active = <any> 'active',
  Failed = <any> 'failed',
  Completed = <any> 'completed'
}
