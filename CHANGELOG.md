# Job Manager Change Log

## v0.5.1 Release Notes

### Made the `name` and `id` columns in the job list more configurable

They will no longer appear unless explicitly included in the capabilities (either default or `capabilities_config.json` file).  The job details drop-down menu and the link to the job details page will always be attached to the first column, no matter what that is.

### Made it possible to completely configure the order of columns in the capabilities endpoint

The order of the columns in either the default settings or `capabilities_config.json` file will be the order they appear on the job list page.

### Added the `filterable` property to the displayFields in the capabilities endpoint

Any column (not just the first column in the job details drop-down menu) can (if it is not also `editable`) the ability to filter by the name:value pair in a particular cell.
