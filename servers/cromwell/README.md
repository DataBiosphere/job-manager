# Job Manager API Server: `cromwell`

Thin shim around [`cromwell`](https://github.com/broadinstitute/cromwell).

## Development

- Set the `CROMWELL_URL` environment variable to specify which cromwell instance to use, for example:

    ```
    export CROMWELL_URL=https://example-cromwell.broadinstitute.org/api/workflows/v1
    ```

    - **Note:** If you want to setup this API Server against a locally hosted Cromwell instance, you cannot just use `localhost` or `127.0.0.1` because the docker compose image will try to connect back to itself rather than to your local host.
    - Instead, provide the IP address (inet if the Cromwell is hosted on the same machine) to the Cromwell with port numbers. for example:
    ```
    export CROMWELL_URL=http://192.168.0.106:8000/api/workflows/v1
    ```
- (Optional) Fine-tune the parameters of Gunicorn server.
    - By default, the shim layer uses **5** [Gunicorn workers](http://docs.gunicorn.org/en/stable/settings.html#worker-class). You can override the default number of workers by:

        ```
        export GUNICORN_CMD_ARGS="--workers=$NUMBER_OF_WORKERS"
        ```
        You can even use dynamic number of workers(based on the number of CPU cores), which is recommended, by:
        ```
        export GUNICORN_CMD_ARGS="--workers=$((2 * $(getconf _NPROCESSORS_ONLN 2>/dev/null || getconf NPROCESSORS_ONLN 2>/dev/null || echo 2) + 1))"
        ```

    - By default, the shim layer uses **sync** [Gunicorn worker type](http://docs.gunicorn.org/en/stable/design.html#sync-workers). Since Job Manager also comes with `gevent` workers, you can override the default worker type by:

        ```
        export GUNICORN_CMD_ARGS="--worker-class gevent"
        ```

    - For convenience, you can consolidate the parameters in one command:

        ```
        export GUNICORN_CMD_ARGS="--workers=$((2 * $(getconf _NPROCESSORS_ONLN 2>/dev/null || getconf NPROCESSORS_ONLN 2>/dev/null || echo 2) + 1)) --worker-class gevent"
        ```
        before you run the shim container.

- (Optional) Set up basic HTTP authentication

  - Add a file named `config.json` to `job-manager/servers/cromwell/jobs` that contains the username and password for the specified cromwell instance (You may want to skip this step if the Cromwell instance does not have HTTP Basic Authentication):
    ```json
    {
      "cromwell_user" : "USERNAME",
      "cromwell_password" : "PASSWORD"
    }
    ```

- (Optional, standalone Cromwell instance) Configure fields to display
  - Optionally change either the predefined view or the default behavior of UI to some extent, eg
    - Display more columns in the job list view such as labels of the jobs
    - Make more columns to be popped up by the query builder
  - Add a `capabilities_config.json` file to `job-manager/servers/cromwell/jobs` to override the pre-defined configurations.
  - The `capabilities_config.json` should **strictly** follow the following structure:
```json
{
  "displayFields": [
    {
      "field": "id",
      "display": "Workflow ID"
    },
    {
      "field": "name",
      "display": "Name",
      "filterable": true
    },
    {
      "field": "status",
      "display": "Status"
    },
    {
      "field": "submission",
      "display": "Submitted",
      "fieldType": "date"
    },
    {
      "field": "labels.label",
      "display": "Label",
      "fieldType": "text",
      "editable": true,
      "bulkEditable": true
    },
    {
      "field": "labels.flag",
      "display": "Flag",
      "editable": true,
      "bulkEditable": true,
      "fieldType": "list",
      "validFieldValues": [
        "archive",
        "follow-up"
      ]
    },
    {
      "field": "labels.comment",
      "display": "Comment",
      "fieldType": "text",
      "editable": true
    }
  ],
  "commonLabels": [
    "id",
    "name",
    "label",
    "comment",
    "flag"
  ],
  "queryExtensions": [
    "hideArchived"
  ]
}
```
  - For the `displayFields`, which represent the columns that will be available in the job list view:
    - The order that the fields are listed in will be the order in which they appear
    - Both `editable`, `bulkEditable` and `filterable` will be treated as `false` unless explicitly set to `true`
        - If the field is `editable`, then `fieldType` is required.
        - If the field is `editable`, then `filterable` will be ignored.

- (Optional) Configure fields to display
  - **Note:** If you want to use Job Manager against Cromwell instances that are using Google OAuth for authZ/authN but NOT SAM (CromIAM):

    1. you need to set the environment variable `INCLUDE_SUBWORKFLOWS` to `False`, i.e. `export INCLUDE_SUBWORKFLOWS=False` for the API, so it can filter out sub-workflows in the job list page. See details [here](https://github.com/DataBiosphere/job-manager/pull/576/files#diff-7c1402d297121c5f41a8bb4659a55271R391)
    2. the `capabilities_config.json` must also include some extra fields, as well as proper scopes, which are shown as below:
```json
{
  "displayFields": [
    {
      "field": "id",
      "display": "Workflow ID"
    },
    {
      "field": "name",
      "display": "Name",
      "filterable": true
    },
    {
      "field": "status",
      "display": "Status"
    },
    {
      "field": "submission",
      "display": "Submitted",
      "fieldType": "date"
    },
    {
      "field": "labels.label",
      "display": "Label",
      "fieldType": "text",
      "editable": true,
      "bulkEditable": true
    },
    {
      "field": "labels.flag",
      "display": "Flag",
      "editable": true,
      "bulkEditable": true,
      "fieldType": "list",
      "validFieldValues": [
        "archive",
        "follow-up"
      ]
    },
    {
      "field": "labels.comment",
      "display": "Comment",
      "fieldType": "text",
      "editable": true
    }
  ],
  "commonLabels": [
    "id",
    "name",
    "label",
    "comment",
    "flag"
  ],
  "queryExtensions": [
    "hideArchived"
  ],
  "authentication": {
    "isRequired": true,
    "scopes": [
      "openid",
      "email",
      "profile"
    ]
  }
}
```
  - If it isn't something your users will object to, you can add the "https://www.googleapis.com/auth/devstorage.read_only" scope and you will be able to see the contents of log files in Job Manager.

- (Required, CromIAM with automatic signout) Configure fields to display
  - **Note:** If you want to use Job Manager against CromIAM and you want inactive users to be signed out after a specific interval of time, the `capabilities_config.json` must also include some extra fields, which are shown as below:
```json
{
  "displayFields": [
    {
      "field": "id",
      "display": "Workflow ID"
    },
    {
      "field": "name",
      "display": "Name",
      "filterable": true
    },
    {
      "field": "status",
      "display": "Status"
    },
    {
      "field": "submission",
      "display": "Submitted",
      "fieldType": "date"
    },
    {
      "field": "labels.label",
      "display": "Label",
      "fieldType": "text",
      "editable": true,
      "bulkEditable": true
    },
    {
      "field": "labels.flag",
      "display": "Flag",
      "editable": true,
      "bulkEditable": true,
      "fieldType": "list",
      "validFieldValues": [
        "archive",
        "follow-up"
      ]
    },
    {
      "field": "labels.comment",
      "display": "Comment",
      "fieldType": "text",
      "editable": true
    }
  ],
  "commonLabels": [
    "id",
    "name",
    "label",
    "comment",
    "flag"
  ],
  "queryExtensions": [
    "hideArchived"
  ],
  "authentication": {
    "isRequired": true,
    "scopes": [
      "openid",
      "email",
      "profile"
    ],
    "forcedLogoutDomains": [
      "foo.bar"
    ],
    "forcedLogoutTime": 20000000
  }
}
```
  - The `forcedLogoutDomains` setting is an array of user domains where this should apply.
  - The `forcedLogoutTime` is the amount of inactive time (in milliseconds) that will trigger an automatic sign-out.


- (Optional, CromIAM and SAM) Configure fields to display
  - **Note:** If you want to use Job Manager against CromIAM and you also have access to a SAM server to handle authentication, the `capabilities_config.json` can be set up with the `outsideAuth` setting in the `authentication` section, which will allow Job Manager to get Google Pipelines operation details and the contents of log files stored in the job's execution directory:
```json
{
  "displayFields": [
    {
      "field": "id",
      "display": "Workflow ID"
    },
    {
      "field": "name",
      "display": "Name",
      "filterable": true
    },
    {
      "field": "status",
      "display": "Status"
    },
    {
      "field": "submission",
      "display": "Submitted",
      "fieldType": "date"
    },
    {
      "field": "labels.label",
      "display": "Label",
      "fieldType": "text",
      "editable": true,
      "bulkEditable": true
    },
    {
      "field": "labels.flag",
      "display": "Flag",
      "editable": true,
      "bulkEditable": true,
      "fieldType": "list",
      "validFieldValues": [
        "archive",
        "follow-up"
      ]
    },
    {
      "field": "labels.comment",
      "display": "Comment",
      "fieldType": "text",
      "editable": true
    }
  ],
  "commonLabels": [
    "id",
    "name",
    "label",
    "comment",
    "flag"
  ],
  "queryExtensions": [
    "hideArchived"
  ],
  "authentication": {
    "isRequired": true,
    "scopes": [
      "openid",
      "email",
      "profile"
    ],
    "outsideAuth": true
  }
}
```
  - For this to function, you will also need to set `SAM_URL` in `cromwell-caas-compose.yaml`, e.g. `https://sam.caas-dev.broadinstitute.org/api/google/v1`, and, **just as importantly** have a way to give pet accounts access to their associated bucket/execution directory.

- Link docker compose
  - **Note:** You may have completed this already if following the Job Manager [Development instructions](../../README.md#Development)
  - Symbolically link the cromwell docker compose file depending on your `CROMWELL_URL`. For Cromwell-as-a-Service, e.g. `https://cromwell.caas-dev.broadinstitute.org/api/workflows/v1`, use `cromwell-caas-compose.yaml` otherwise use `cromwell-instance-compose.yaml`, e.g:
    ```
    ln -sf cromwell-instance-compose.yml docker-compose.yml
    ```

- [Return](../../README.md#run-locally) to the main Job Manager Development instructions to continue.


## Starting Jobs
The Job Manager does not currently support launching jobs. Cromwell jobs can be launched by sending a `POST` request to the `/api/workflows/{version}` endpoint. For example:
```
cd servers/cromwell/jobs/test/test_workflow
curl -X POST "${CROMWELL_URL}" \
    -u "username:password" \
    -H "accept: application/json" \
    -H "Content-Type: multipart/form-data" \
    -F "workflowSource=@test_workflow.wdl" \
    -F "workflowInputs=@inputs.json;type=application/json" \
    -F "labels=@labels.json;type=application/json" \
    -F "workflowDependencies=@deps.zip;type=application/zip"
```


## Running Tests
To run unit and integration tests on the python-flask app, install
[`tox`](https://github.com/tox-dev/tox).
```
cd servers/cromwell
tox -- -s .
```
