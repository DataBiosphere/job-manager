# Job Manager Change Log

## v0.6.0 Release Notes

### Applied new look-and-feel

## v0.5.10 Release Notes

### Force reload of /jobs after sign-out to clear out the previous user's list.

## v0.5.9 Release Notes

### Modified query to backend when it's going to a CromIAM instead of a Cromwell

## v0.5.8 Release Notes

### Added events to timing diagram

Timing diagram now includes events within each task/subworkflow and the rendered width is no longer hard-coded.

### Increased minimum number of jobs loaded in the UI to better handle page size being set to 100.

### Added better error handling to authentication

- Capture the error in cases where the UI is trying to use OAuth but the Cromwell it's pointing at doesn't require authentication.
- Capture the error case where the user is unauthorized to run queries and prompt to log in again in case it's because of a stale or revoked access token.

## v0.5.7 Release Notes

### Modified the links to logs/directories in GCP

Updated links for Cromwell stdout and stderr log files to now reference an appropriate page in the google console.

## v0.5.6 Release Notes

### Embedded timing diagram within UI

Timing diagram is now rendered in the UI using the job metadata and displayed as one of the tabs in the Job Details page.

### Updated display of dates/times in Job List and Details

Dates/times for the current day, the current year and all others are displayed uniquely. Full date and time (including seconds) are displayed in tooltip on mouseover.

## v0.5.5 Release Notes

### Fixed bug where total results were not being updated in the job list paginator

### Changed `health` endpoint to not need authentication

## v0.5.4 Release Notes

### Added Sign out button to Job List.

Button will log user out via Google Auth (`gapi.auth2`).

## v0.5.3 Release Notes

### Health check endpoint for APIs

Cromwell API will now return 503 if it cannot reach the Cromwell service.

## v0.5.2 Release Notes

### Add a button to clear the query builder chips

This will not clear the `projectId` chip.

### Clarified Job Details

The job status is now clearly displayed in text and icon on the `Status` card; scattered task status will more accurately represented.

### Re-organized Job Details

The job `Inputs` and `Outputs` have been moved from the `Resources` panel to the tabbed panel.  The `Errors` panel has been converted to a card and displays the first four errors more succinctly.  Added an icon to allow navigation from child job to the parent job.

## v0.5.1 Release Notes

### Made the `name` and `id` columns in the job list more configurable

They will no longer appear unless explicitly included in the capabilities (either default or `capabilities_config.json` file).  The job details drop-down menu and the link to the job details page will always be attached to the first column, no matter what that is.

### Made it possible to completely configure the order of columns in the capabilities endpoint

The order of the columns in either the default settings or `capabilities_config.json` file will be the order they appear on the job list page.

### Added the `filterable` property to the displayFields in the capabilities endpoint

Any column (not just the first column in the job details drop-down menu) can (if it is not also `editable`) the ability to filter by the name:value pair in a particular cell.
