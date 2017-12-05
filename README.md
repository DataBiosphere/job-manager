# Job Manager

Job Manager API and UI for interacting with asynchronous batch jobs.

## Development

### Prerequisite
The following commands assume you have symbolically linked your preferred
local API backend docker compose file as `docker-compose.yml`, e.g.:
```
ln -sf dsub-local-compose.yml docker-compose.yml
```
Alternatively, use:
```
docker-compose -f dsub-google-compose.yml CMD
```

### Server Setup
For setting up development with [`dsub`](https://github.com/googlegenomics/dsub)
see [servers/dsub](servers/dsub/README.md#Development).

For setting up development with [`cromwell`](https://github.com/broadinstitute/cromwell)
see [servers/cromwell](servers/cromwell/README.md#Development).


### Run Locally
1. Run `docker-compose up` from the root of the repository:
1. Navigate to http://localhost:4200.

#### Notes
1. Websocket reload on code change does not work in docker-compose (see
https://github.com/angular/angular-cli/issues/6349).
1. Changes to `package.json` or `requirements.txt` require a rebuild with:
  ```
  docker-compose up --build
  ```
  Alternatively, rebuild a single component:
  ```
  docker-compose build ui
  ```

### Updating the API using swagger-codegen
We use [swagger-codegen](https://github.com/swagger-api/swagger-codegen) to automatically implement the API, as defined in `api/jobs.yaml`, for all
servers and the UI. Whenever the API is updated, follow these steps to
update the UI implementation:

1. If you do not already have the jar, you can download it here:
  ```
  # Linux
  wget http://central.maven.org/maven2/io/swagger/swagger-codegen-cli/2.2.3/swagger-codegen-cli-2.2.3.jar -O swagger-codegen-cli.jar
  # macOS
  brew install swagger-codegen
  ```
1. Clear out existing generated models:
  ```
  rm ui/src/app/shared/model/*
  rm servers/dsub/jobs/models/*
  rm servers/cromwell/jobs/models/*
  ```
1. Regenerate both the python and angular definitions.
  ```
  java -jar swagger-codegen-cli.jar generate \
    -i api/jobs.yaml \
    -l typescript-angular2 \
    -o ui/src/app/shared
  java -jar swagger-codegen-cli.jar generate \
    -i api/jobs.yaml \
    -l python-flask \
    -o servers/dsub \
    -DsupportPython2=true,packageName=jobs
  java -jar swagger-codegen-cli.jar generate \
    -i api/jobs.yaml \
    -l python-flask \
    -o servers/cromwell \
    -DsupportPython2=true,packageName=jobs
  ```
1. Update the UI implementation to resolve any broken dependencies on old API definitions or implement additional functionality to match the new specs.

## Job Manager UI Server
For UI server documentation, see [ui](ui/).

## Job Manager `dsub` Server
For `dsub` server documentation, see [servers/dsub](servers/dsub/README.md).

## Job Manager `cromwell` Server
For `cromwell` server documentation, see [servers/cromwell](servers/cromwell/README.md).
