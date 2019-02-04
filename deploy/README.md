# Job Manger Deployment

*Note: This folder contains instructions, as well as template config templates, for a limited number of deployment
 options for Job Manager. You can choose any of the deployment options from them, or even create your own 
 deployment workflow, depends on your infrastructure and requirements.*
 

```
deploy/
├── README.md
├── cromwell/
│   ├── api-config.json
│   ├── capabilities-config.json
│   ├── app-engine/
│   ├── docker-compose/
│   └── kubernetes/
├── dsub/
│   ├── app-engine/
│   ├── docker-compose/
│   └── kubernetes/
└── ui-config.json

```

The above structure shows how the deployment instructions are organized, Cromwell and dsub have their own set of
deployment instructions and configurations respectively. From v0.2.0, each Job Manager's release contains 2 docker images, 
e.g. UI and API(shim), once you pick a proper version(v0.2.0+), you could deploy the 2 images either on the same server
or different servers, depends on your preferred infrastructure.


## Configuration files
In order to deploy Job Manager properly, you have to provide a set of config files.

### UI config
As the [`ui-config.json`](./ui-config.json) shows, this file contains the information required by the Job Manager UI layer:

- `apiUrl` indicates the path to the API(shim) layer. If UI and API are deployed separately, this will become the 
url to the API.
- `clientId` should be provided if you want to enable the 
[Google Sign-In](https://developers.google.com/identity/sign-in/web/sign-in) feature. This require you to create a 
valid client ID within the Google cloud project which the Job Manager is deployed to.
- `dashboardEnabled` controls whether you want to enable the dashboard view in the UI.

**Note:** This file has to be mounted as `/ui/dist/assets/environments/environment.json` in the Job Manager UI docker
 container during the deployment.

### Capabilities config <a id="capabilities-anchor"></a>

#### Cromwell 
As the [`capabilities-config.json`](./cromwell/capabilities-config.json) shows, this file contains the information that UI can fetch from the capabilities
endpoint of the API, which in turn controls a few behaviors of the UI layer:

- `displayFields` controls which fields would be displayed as columns in the job list view. 
- `field` is the underlying value of the job's attribute. For Cromwell, use `labels.foo` to refer to a job label `foo`.
- `display` is the name that will be displayed in the UI.
- `fieldType`, `validFieldValues`, `editable` and `bulkEditable` are currently only supported by Cromwell backend. 
Both `editable` and `bulkEditable` will be treated as false unless explicitly set to true, if the field is 
`editable`, then `fieldType` is required.
- `commonLabels` controls if the field will become a predefined search key in the query builder.
- `queryExtensions` represents those ExtendedQueryFields which are queryable, depends on your requirements. Usually the 
default value should be fine.
- `authentication` is optional. You should set the `isRequired` to `true` if you want to enable the Google OAuth 
Sign-In ability.

Note: if you don't provide the `capabilities-config.json` to override the default value, Job Manager will try to use the
following values:
```JSON
{
  "displayFields": [
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
      "field": "labels.cromwell-workflow-id",
      "display": "Workflow ID"
    },
    {
      "field": "labels.label",
      "display": "Label",
      "editable": true,
      "bulkEditable": true,
      "fieldType": "text"
    },
    {
      "field": "labels.flag",
      "display": "Flag",
      "editable": true,
      "bulkEditable": true,
      "fieldType": "list",
      "validFieldValues": ["archive", "follow-up"]
    },
    {
      "field": "labels.comment",
      "display": "Comment",
      "editable": true,
      "fieldType": "text"
    }
  ],
  "commonLabels": [
    "cromwell-workflow-id",
    "label",
    "flag"
  ],
  "queryExtensions": []
}
```

#### dsub
dsub is using hard-coded predefined capabilities configuration for now, so this file is only configurable for Cromwell.
To provide a better visibility of the default values, depends on the value of the environment variable `PROVIDER_TYPE`, 
the full version default config can be translated into the following JSON format:
```JSON
{
  "displayFields": [
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
      "field": "labels.job-id",
      "display": "Job ID"
    },
    {
      "field": "labels.task-id",
      "display": "Task ID"
    },
    {
      "field": "extensions.userId",
      "display": "User ID"
    },
    {
      "field": "extensions.statusDetail",
      "display": "Status Detail"
    }
  ],
  "commonLabels": [
    "job-id",
    "task-id"
  ],
  "queryExtensions": ["userId", "submission", "projectId"],
  "authentication": {
      "isRequired": true,
      "scopes": [
        "https://www.googleapis.com/auth/genomics",
        "https://www.googleapis.com/auth/cloudplatformprojects.readonly",
        "https://www.googleapis.com/auth/devstorage.read_only"
      ]
    }
}
```

**Note:** no matter where you want to mount this file to, the path to this file has to be provided by the environment
variable `CAPABILITIES_CONFIG`, otherwise Job Manager will try to use the default capabilities config, which might not
be able to handle all of your use cases, so we don't recommend you use the default capabilities configuration.

### API config (optional, only required by Cromwell) <a id="credentials-anchor"></a>
This is an optional config file. As the [`api-config.json`](./cromwell/api-config.json) shows, 
 this file is Cromwell-specific and contains HTTPBasicAuth credentials to access to a Cromwell instance.
 You don't need to provide this file if:

- Your Cromwell backend does not use HTTPBasicAuth.
- Your Cromwell is using OAuth.

**Note:** no matter where you want to mount this file to, the path to this file has to be provided by the environment
variable `CROMWELL_CREDENTIALS`, otherwise Job Manager will assume you don't have HTTPAuth with the Cromwell backend.

### Nginx config
This file refers to the Nginx configuration, since different deployments require different settings for Nginx, e.g. GAE
expects the runtime to serve HTTP traffic from port 8080; GKE expects a health check, you have to tweak this config 
based on your preferred infrastructure.

**Note:** This file has to be mounted as `/etc/nginx/nginx.conf` in the Job Manager UI docker container during 
the deployment.

## Environment variables
In order to make Job Manager work properly, during the deployment, you have to set the following environment variables:

### Common

- `PATH_PREFIX` indicates the path prefix of the API to serve from, by default, it will use `/api/v1`.

- `PYTHONDONTWRITEBYTECODE` should be set to a true value to avoid writing .pyc on the import of source modules, which
 can cause potential problems.

- `GUNICORN_CMD_ARGS` gives you the ability to fine-tune the Gunicorn settings for the API(shim) layer. 
By default, the shim layer uses **sync** [Gunicorn worker type](http://docs.gunicorn.org/en/stable/design.html#sync-workers). Since Job Manager also
 comes with `gevent` workers, you can override the default worker type. Besides, you can also set the number of Gunicorn
 workers via this variable. The following value is recommended for general use cases:
    ```bash
    export GUNICORN_CMD_ARGS="--workers=$((2 * $(getconf _NPROCESSORS_ONLN 2>/dev/null || getconf NPROCESSORS_ONLN 2>/dev/null || echo 2) + 1)) --worker-class gevent"
    ```
 Check the [Gunicorn documentation](http://docs.gunicorn.org/en/stable/settings.html#settings) for more configurable parameters.

### Cromwell

- `CAPABILITIES_CONFIG` defines the path to the `capabilities_config.json` file, which controls a few behaviors of the
 UI layer. Check [this section](#capabilities-anchor) for more information. 

- `CROMWELL_CREDENTIALS` defines the path to the `api_config.json` file, which contains HTTPBasicAuth credentials to 
access a Cromwell instance. By default, it will assume no credentials for the Cromwell instance. Check 
[this section](#credentials-anchor) for more information.

- `CROMWELL_URL` specifies which cromwell instance to use, 
e.g. `export CROMWELL_URL=https://example-cromwell.broadinstitute.org/api/workflows/v1`. This variable is **necessary**,
Job Manager cannot work without setting this properly.

- `USE_CAAS` controls whether the cromwell backend is using cromwell-as-a-service. Besides, this should also be set to
 true if the Cromwell instance is using OAuth 2, which requires Bearer token in the header for each request to Cromwell.
 By default this value is set to false.

### dsub

- `PROVIDER_TYPE` specifies the dsub provider type to use for managing jobs, the provider choices are: `google`,
 `local`, or `stub`.

- `REQUIRES_AUTH` is a boolean indicating if authentication is required. 
