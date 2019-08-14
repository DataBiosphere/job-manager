# Job Manager Change Log

## v1.5.0 Release Notes

### Added the ability -- if Job Manager is being run with access to a SAM server -- to see the contents of Google Storage log files within the UI.

### Added the ability to completely expand the operation details with one click.

## v1.4.1 Release Notes

### Fixed a bug that caused Job Manager to throw a 500 error when it attempted to process a scattered task shard with no end time.

## v1.4.0 Release Notes

### Added an additional log to the job details page, which provides details from the Google Pipelines backend.

### Added a button to the Job Details page that copies the current job ID to the user's clipboard.

### Made some security-related updates to the package versions for the UI.

## v1.3.2 Release Notes

### Fixed a bug that needlessly redirected a user to the Sign In page before every page load.

## v1.3.1 Release Notes

### Fixed a bug where clicking on operation details icon will show attempt data.

### Fixed a bug that caused Job Manager to throw a 500 error when it attempted to process a scattered task shard with no start time.

## v1.3.0 Release Notes

### Added icon that, when clicked, will provide Google Pipelines operation details. (So far) only implemented for a Cromwell backend, and it requires `outsideAuth` to be set to `true` in the authentication section of the `capabilities_config.json` file.

## v1.2.3 Release Notes

### Added logic to avoid 500 error on Job Details page when a workflow failure section does not have a causedBy entry.

## v1.2.2 Release Notes

### Added 'Abort Job' button to Job Details page.

## v1.2.1 Release Notes

### Added logic to avoid 500 error on Job Details page when a task does not have a start time.

## v1.2.0 Release Notes

### Added the ability -- with the addition of a specific scope to the capabilities config file -- to see the contents of Google Storage log files within the UI.

## v1.1.1 Release Notes

### Fixed auto-logout bug which was triggering logout with no configuration.

## v1.1.0 Release Notes

### Added the ability to configure auto sign-out after a period of inactivity, per user domain, if Job Manager is pointing at a CromIAM.

### Labels that are set to be hidden on the Job List page will not be shown at the top of the Job Details page.

#### The full list of labels associated with a job has been moved to a new 'Labels' tab.

### Fixed bug with icon designating scattered tasks.

## v1.0.0 Release Notes

### Multiple changes to the "List" tab in the Job Details page for Cromwell jobs.

#### If a task or shard has multiple attempts it can be clicked on, which will expand to show additional rows, one for each attempt.

#### Scattered task names are a link that will display scattered task shards in a dialog box.

#### Scattered sub-workflow shards are a link that will take the users to a "Job Details" page with details of that shard.

#### Added icons for inputs and outputs which can be clicked on to show the full list.

#### Changed the call-cached icon and moved it into the "duration" column.

### Re-implemented shard data requests to get data more efficiently from the API.

## v0.7.3 Release Notes

### Fixed the broken display of icons in Firefox.

### Changed the color of the message icon from green to red to make it stand out more.

### Added styling to Job Details page tabs to add clarity.

### Elevated sub-workflow errors to the parent workflow error card on the Job Details page.

#### Added a link to the sub-workflow in the error card.

## v0.7.2 Release Notes

### Improved the clarity of workflow-level errors.

### Fixed incorrectly translated job attempt status from Cromwell backend.

### Fixed incorrect tooltip for standard out log.

### Added customized favicon.

## v0.7.1 Release Notes

### Added individual shards and their execution events to the timing diagram.

## v0.7.0 Release Notes

### Further improved the performance of the Job dDetails page when pointed at Cromwell.

### Made the behavior of all log and execution directory icons/links consistent throughout the Job Details page.

### Added more useful UI behavior when user submits an invalid query on the Job List page.

### Surfaced additional error information from Cromwell metadata responses on the Job Details page.

## v0.6.3 Release Notes

### Fixed bug where failure message(s) are not displayed if the job failed before Cromwell was able to run it (most likely due to a validation error).

### Removed 'loading' screen when user has made an invalid query on job list page so the user can make changes.

### Made behavior of message, log and execution icons consistent across all contexts in the job details page.

Also fixed bug where Google Console file links sometimes pointed to unexpected places.

### Improved the performance of the job details page when pointed at Cromwell by tailoring the metadata cache request.

## v0.6.2 Release Notes

### Fixed bug where scattered tasks' status, duration, timing diagram and number of attempts were inaccurate.

### Limited the size of metadata response from Cromwell by using the `includeKey` option in order to reduce the likelihood of a time-out.

## v0.6.1 Release Notes

### Fixed bug where job IDs that started with a number could not be queried for.

### Fixed display bug with error card on job details page.

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
