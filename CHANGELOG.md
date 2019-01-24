# Job Manager Change Log

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