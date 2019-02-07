# Job Manager API Server: `cromwell`

Thin shim around [`cromwell`](https://github.com/broadinstitute/cromwell).

## Development

- Set the `CROMWELL_URL` environment variable to specify which cromwell instance to use, for example:
    
    ```
    export CROMWELL_URL=https://example-cromwell.broadinstitute.org/api/workflows/v1
    ```

    - **Note:** If you want to setup this API Server against a locally hosted Cromwell instance, you cannot just use `localhost` or `127.0.0.1` because the docker compose image will try to connect back to itself rather than to your local host.
    - Instead, provide the ip address (inet if the Cromwell is hosted on the same machine) to the Cromwell with port numbers. for example:
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

- (Required, CaaS only) Configure fields to display
  - **Note:** If you want to use use Job Manager against Cromwell-as-a-Service, which is using SAM/Google OAuth for authZ/authN, the `capabilities_config.json` must also include some extra fields, as well as proper scopes, which are shown as below:
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
tox -- -s
```

## Generating `requirements.txt`

`requirements.txt` is autogenerated from `requirements-to-freeze.txt`. The
latter lists only direct dependencies. To regenerate run:
```
virtualenv --python=/usr/bin/python2 /tmp/cromwell-server-requirements
source /tmp/cromwell-server-requirements/bin/activate
```
Then, from the cromwell directory in this repo:
```
pip install -r requirements-to-freeze.txt
pip freeze | sort -f | sed 's/^jm-utils.*/\.\.\/jm_utils/g' > requirements.txt
deactivate
```

The sed command above replaces jm-utils=x.y.z with ../jm_utils, which is required
to allow pip to install from the local jm_utils directory.
