# Job Manager

If you're looking for basics for Terra developers, see [here](TERRA_QUICKSTART.md).

[![CircleCI branch](https://img.shields.io/circleci/project/github/DataBiosphere/job-manager/master.svg?label=Tests%20on%20Circle%20CI&style=flat-square)](https://circleci.com/gh/DataBiosphere/job-manager/tree/master)
![Github](https://img.shields.io/badge/Supported%20Backends-cromwell-blue.svg?&style=flat-square)
![GitHub](https://img.shields.io/github/license/DataBiosphere/job-manager.svg?color=orange&style=flat-square)
[![GitHub release](https://img.shields.io/github/release/DataBiosphere/job-manager.svg?label=Latest%20Release&style=flat-square&colorB=green)](https://github.com/DataBiosphere/job-manager/releases)
[![Github](https://img.shields.io/badge/Docker%20Image-UI-blue.svg?style=flat-square)](https://console.cloud.google.com/gcr/images/broad-dsp-gcr-public/US/job-manager-ui)
[![Github](https://img.shields.io/badge/Docker%20Image-cromwell%20shim%20API-blue.svg?style=flat-square)](https://console.cloud.google.com/gcr/images/broad-dsp-gcr-public/US/job-manager-api-cromwell)

## Lifecycle notice

Job Manager is in maintenance mode and is not recommended for new projects.

dsub support is deprecated and has been removed.

The last release of Job Manager to support dsub without compromise is [1.5.7](https://github.com/DataBiosphere/job-manager/releases/tag/v1.5.7).

## User facing documentation

Welcome to the Job Manager repository! If you're a developer you're in the right place.

However, if you just want to try out or deploy Job Manager, you will probably find our user and deployment focused content in
our ReadTheDocs pages: https://data-biosphere-job-manager.readthedocs.io/en/latest/

## Welcome

See the [development guide](#development) below.

The Job Manager is an API and UI for monitoring and managing jobs in a backend execution engine.

The Broad, Verily, and many other organizations in the life sciences execute enormous numbers of scientific workflows and need to manage those operations. Job Manager was born out of the experiences of producing data for some of the world’s largest sequencing projects such as The Cancer Genome Atlas, Baseline, and the Thousand Genomes Project.

The Job Manager aspires to bring ease and efficiency to developing and debugging workflows while seamlessly scaling to production operations management.

## Key Features
* Supports visualization over [Cromwell](https://github.com/broadinstitute/cromwell) backend
* Service provider interface can be extended to support other engines
* Rich search capabilities across current and historic workflows
* Aborting workflows
* Clean, intuitive UX based on material design principles

## Architecture Overview

The Job Manager [defines an API](api/jobs.yaml) via OpenAPI. An Angular2 UI is provided over the autogenerated Typescript bindings for this API. The UI is configurable at compilation time to support various deployment environments (see [environment.ts](ui/src/environments/environment.ts)), including auth, cloud projects, and label columns.

The UI must be deployed along with a backend implementation of the API, two such implementations are provided here:

### Cromwell
Monitors jobs launched by the [Cromwell workflow engine](https://github.com/broadinstitute/cromwell). The Python Flask wrapper was created using Swagger Codegen and can be configured to pull data from a specific Cromwell instance. _At this time, to utilize all job manager features, please consider using Cromwell v32 or newer._

## Development

### Prerequisites

- Install docker and docker-compose
- Check out the repository and navigate to the directory:
  ```sh
    git clone https://github.com/DataBiosphere/job-manager.git
    cd job-manager
  ```
- Setup git-secrets on the repository:
  - On Mac:
  ```
  brew install git-secrets
  ```

  - On Linux:
  ```
  rm -rf git-secrets
  git clone https://github.com/awslabs/git-secrets.git
  cd git-secrets
  sudo make install && sudo chmod o+rx /usr/local/bin/git-secrets
  cd ..
  rm -rf git-secrets
  ```

- Configure the `git secrets` hook:
  ```sh
    git secrets --install
  ```

### Server Setup

#### Cromwell

- Link your preferred backend docker compose file as `docker-compose.yml`:

  - Cromwell (local): `ln -sf cromwell-instance-compose.yml docker-compose.yml`
  - Cromwell (CaaS): `ln -sf cromwell-caas-compose.yml docker-compose.yml`
- Follow [servers/cromwell](servers/cromwell/README.md#Development) for Cromwell server setup then return here to continue.


### Run Locally
- Run `docker-compose up` from the root of the repository:
  - If this is the first time running `docker-compose up`  this might take a few minutes.
  - Eventually you should see a compilation success message like this: 
  ```
  jmui_1        | webpack: Compiled successfully.
  ```
- Make sure that your Cromwell backend is ready to receive query requests. 
- Navigate to http://localhost:4200.

#### Notes
1. Websocket reload on code change does not work in docker-compose (see
https://github.com/angular/angular-cli/issues/6349).
2. Changes to `package.json` or `requirements.txt` or [regenerating the API](#updating-the-api-using-swagger-codegen) require a rebuild with:
  ```
  docker-compose up --build
  ```
  Alternatively, rebuild a single component:
  ```
  docker-compose build ui
  ```

### Updating the API using swagger-codegen

* We use [swagger-codegen](https://github.com/swagger-api/swagger-codegen) to transform the API 
defined in `api/jobs.yaml` into appropriate classes for the servers and the UI to use.
* Whenever the API is updated, run this to trigger a rebuild: 
```sh
docker-compose up rebuild-swagger
```
 
#### Swagger codegen notes

* The `rebuild-swagger` job does nothing if the file `api/jobs.yaml` has not changed since the
last time it was run.
* The `rebuild-swagger` job will run by default during `docker-compose up` to generate the swagger for the other 
services if necessary. The other services will not start until their swagger classes exist.
* After regenerating the model files, you'll need to test and update the server implementations to 
resolve any broken dependencies on old API definitions or implement additional functionality to match the new specs. 

## Job Manager UI Server
For UI server documentation, see [ui](ui/).

## Job Manager `cromwell` Server
For `cromwell` server documentation, see [servers/cromwell](servers/cromwell/README.md).

## Build docker images and releases

### How to build

Starting with release v1.6.0, Job Manager docker images are on [GCR](https://console.cloud.google.com/gcr/images/broad-dsp-gcr-public).

- Configure Docker to authenticate with GCR
    ```
    gcloud config set account username@broadinstitute.org
    gcloud auth configure-docker us.gcr.io
    ```

- Set the Docker tag first in bash, e.g. `TAG="v0.1.0"`

- To publish the `job-manager-ui` image with `$TAG` from the root of this Github repository:
    ```
    docker build -t us.gcr.io/broad-dsp-gcr-public/job-manager-ui:$TAG . -f ui/Dockerfile
    docker push us.gcr.io/broad-dsp-gcr-public/job-manager-ui:$TAG
    ```
    
- To publish the `job-manager-api-cromwell` image with `$TAG` from the root of this Github repository:
    ```
    docker build -t us.gcr.io/broad-dsp-gcr-public/job-manager-api-cromwell:$TAG . -f servers/cromwell/Dockerfile
    docker push us.gcr.io/broad-dsp-gcr-public/job-manager-api-cromwell:$TAG
    ```

### Add a Github release pointing to the GCR images

From v1.6.0, each release in Github will also release 2 corresponding Docker images on GCR:

- [job-manager-ui](https://console.cloud.google.com/gcr/images/broad-dsp-gcr-public/US/job-manager-ui)
- [job-manager-api-cromwell](https://console.cloud.google.com/gcr/images/broad-dsp-gcr-public/US/job-manager-api-cromwell)
