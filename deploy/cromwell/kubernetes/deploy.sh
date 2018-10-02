#!/usr/bin/env bash

# This script is designed to be run by Jenkins to deploy a new Job Manager kubernetes deployment
# =======================================
# Example Usage:
# bash deploy.sh broad-dsde-mint-dev gke_broad-dsde-mint-dev_us-central1-b_lira v0.0.4 \
# "https://cromwell.mint-dev.broadinstitute.org/api/workflows/v1" false true username password dev
# =======================================

function line() {
    printf %"$(tput cols)"s |tr " " "="
}

function stdout() {
    local MSG=$1
    echo -ne ">| Current Step |< ${MSG} ...\n"
}

function stderr() {
    echo -ne ">>| Error Occurred |<< - exiting ...\n"
    exit 1
}

function configure_kubernetes() {
    local GCLOUD_PROJECT=$1
    local GKE_CONTEXT=$2

    stdout "Setting to use Google project: project ${GCLOUD_PROJECT}"
    gcloud config set project ${GCLOUD_PROJECT}

    stdout "Setting to use GKE cluster: project gke_${GCLOUD_PROJECT}_us-central1-b_lira"
    kubectl config use-context ${GKE_CONTEXT}
}

function create_API_config() {
    local VAULT_ENV=$1
    local CONFIG_NAME=$2
    local VAULT_TOKEN_FILE=$3

    CROMWELL_USR=$(docker run -it --rm -v ${VAULT_TOKEN_FILE}:/root/.vault-token broadinstitute/dsde-toolbox vault read -field=cromwell_user secret/dsde/mint/${VAULT_ENV}/common/htpasswd)
    CROMWELL_PWD=$(docker run -it --rm -v ${VAULT_TOKEN_FILE}:/root/.vault-token broadinstitute/dsde-toolbox vault read -field=cromwell_password secret/dsde/mint/${VAULT_ENV}/common/htpasswd)

    stdout "Rendering API's config.json file"
    docker run -i --rm \
        -e CROMWELL_USR=${CROMWELL_USR} \
        -e CROMWELL_PWD=${CROMWELL_PWD} \
        -v ${PWD}:/working broadinstitute/dsde-toolbox:k8s \
        /usr/local/bin/render-ctmpl.sh -k /working/api-config.json.ctmpl

    stdout "Creating API config secret object: ${CONFIG_NAME}"
    kubectl create secret generic ${CONFIG_NAME} --from-file=config=./api-config.json
}

function render_UI_config() {
    local CLIENT_ID=${1:-""}

    stdout "Rendering UI config file for Job Manager UI"
    docker run -i --rm \
        -e CLIENT_ID=${CLIENT_ID} \
        -v ${PWD}:/working broadinstitute/dsde-toolbox:k8s \
        /usr/local/bin/render-ctmpl.sh -k /working/ui-config.json.ctmpl
}

function render_NGINX_conf() {
    local JMUI_VERSION=$1
    local USE_PROXY=$2

    stdout "Rendering UI's nginx.conf file"
    docker run -i --rm \
        -e JMUI_VERSION=${JMUI_VERSION} \
        -e USE_PROXY=${USE_PROXY} \
        -v ${PWD}:/working broadinstitute/dsde-toolbox:k8s \
        /usr/local/bin/render-ctmpl.sh -k /working/nginx.conf.ctmpl
}

function create_jm_configmap_obj() {
    local CONFIG_NAME=$1
    local USE_CAAS=$2
    local CAPABILITIES_CONFIG_FILE=capabilities_config.json
    local UI_CONFIG_FILE=ui-config.json
    local UI_NGINX_FILE=nginx.conf

    if [ ${USE_CAAS} == "true" ]; then
        local CAPABILITIES_CONFIG_FILE=capabilities_config_caas.json
    fi

    stdout "Creating Job Manager configMap object: ${CONFIG_NAME}"
    stdout "This object contains UI config, Nginx config and capabilities config files."

    kubectl create configmap ${CONFIG_NAME} \
        --from-file=capabilities-config=${CAPABILITIES_CONFIG_FILE} \
        --from-file=jm-nginx-config=${UI_NGINX_FILE} \
        --from-file=jm-ui-config=${UI_CONFIG_FILE}
}

function create_UI_proxy() {
    # NOTE: THIS MIGHT NEED TO ME MOUNTED FROM VAULT DIRECTLY for Jenkins Jobs!!!
    local USERNAME=$1
    local PASSWORD=$2
    local CONFIG_NAME=$3

    stdout "Generating Apache proxy based on inputted username and password"
    htpasswd -b -c ./.htpasswd ${USERNAME} ${PASSWORD}

    stdout "Creating UI proxy secret object: ${CONFIG_NAME}"
    kubectl create secret generic ${CONFIG_NAME} --from-file=htpasswd=.htpasswd
}

function apply_kube_deployment() {
    local CROMWELL_URL=$1
    local API_DOCKER_IMAGE=$2
    local API_CONFIG=$3
    local JM_CONFIGMAP_OBJ=$4
    local UI_DOCKER_IMAGE=$5
    local PROXY_CREDENTIALS_CONFIG=$6
    local USE_CAAS=$7
    local USE_PROXY=$8
    local GUNICORN_WORKERS="$((2 * $(getconf _NPROCESSORS_ONLN 2>/dev/null || getconf NPROCESSORS_ONLN 2>/dev/null || echo 2) + 1))"
    local GUNICORN_WORKER_TYPE="gevent"
    local API_PATH_PREFIX="/api/v1"
    local REPLICAS=1

    stdout "Rendering job-manager-deployment.yaml file"
    docker run -i --rm \
        -e REPLICAS=${REPLICAS} \
        -e API_DOCKER_IMAGE=${API_DOCKER_IMAGE} \
        -e API_PATH_PREFIX=${API_PATH_PREFIX} \
        -e CROMWELL_URL=${CROMWELL_URL} \
        -e UI_DOCKER_IMAGE=${UI_DOCKER_IMAGE} \
        -e API_CONFIG=${API_CONFIG} \
        -e PROXY_CREDENTIALS_CONFIG=${PROXY_CREDENTIALS_CONFIG} \
        -e JMUI_CONFIGMAP_OBJ=${JM_CONFIGMAP_OBJ} \
        -e USE_CAAS=${USE_CAAS} \
        -e USE_PROXY=${USE_PROXY} \
        -e GUNICORN_WORKERS=${GUNICORN_WORKERS} \
        -e GUNICORN_WORKER_TYPE=${GUNICORN_WORKER_TYPE} \
        -v ${PWD}:/working broadinstitute/dsde-toolbox:k8s \
        /usr/local/bin/render-ctmpl.sh -k /working/job-manager-deployment.yaml.ctmpl

    stdout "Applying job-manager-deployment.yaml"
    kubectl apply -f job-manager-deployment.yaml
}

function apply_kube_service() {
    stdout "Applying job-manager-service.yaml"
    kubectl apply -f job-manager-service.yaml
}

function apply_kube_ingress() {
    local TLS_SECRET_NAME=$1
    local EXTERNAL_IP_NAME="job-manager"

    # TODO: Mount tls cert and key files from Vault and create TLS SECRET k8s cluster
    # local VAULT_TOKEN_FILE

    stdout "Rendering job-manager-ingress.yaml file"
    docker run -i --rm \
        -e EXTERNAL_IP_NAME=${EXTERNAL_IP_NAME} \
        -e TLS_SECRET_NAME=${TLS_SECRET_NAME} \
        -v ${PWD}:/working broadinstitute/dsde-toolbox:k8s \
        /usr/local/bin/render-ctmpl.sh -k /working/job-manager-ingress.yaml.ctmpl

    stdout "Applying job-manager-ingress.yaml"
    kubectl apply -f job-manager-ingress.yaml
}

function tear_down_kube_secret() {
    local filename=$1

    stdout "Tearing down secret objects on Kubernetes cluster"
    kubectl delete secret ${filename}
}

function tear_down_kube_configMap() {
    local filename=$1

    stdout "Tearing down configMap objects on Kubernetes cluster"
    kubectl delete configmap ${filename}
}

function tear_down_rendered_files() {

    stdout "Removing all generated files"
    rm -rf ".htpasswd"
    rm -rf "api-config.json"
    rm -rf "ui-config.json"
    rm -rf "job-manager-deployment.yaml"
    rm -rf "job-manager-ingress.yaml"
    rm -rf "nginx.conf"
}

# The main function to execute all steps of a deployment of Job Manager
function main() {
    local GCLOUD_PROJECT=$1
    local GKE_CONTEXT=$2
    local JMUI_TAG=$3
    local CROMWELL_URL=$4
    local USE_CAAS=$5
    local USE_PROXY=$6
    local JMUI_USR=$7
    local JMUI_PWD=$8
    local VAULT_ENV=$9
    local CLIENT_ID=${10:-""}
    local VAULT_TOKEN_FILE=${11:-"$HOME/.vault-token"}

    local DOCKER_TAG=${JMUI_TAG}
    local API_DOCKER_IMAGE="databiosphere/job-manager-api-cromwell:${DOCKER_TAG}"
    local UI_DOCKER_IMAGE="databiosphere/job-manager-ui:${DOCKER_TAG}"

    set -e

    line
    configure_kubernetes ${GCLOUD_PROJECT} ${GKE_CONTEXT}

    local API_CONFIG="cromwell-credentials-$(date '+%Y-%m-%d-%H-%M')"
    local JM_CONFIGMAP_OBJ="jm-configmap-$(date '+%Y-%m-%d-%H-%M')"

    local UI_PROXY="jm-htpasswd-$(date '+%Y-%m-%d-%H-%M')"

    if [ ${USE_PROXY} == "true" ]; then
        local USERNAME=${JMUI_USR}
        local PASSWORD=${JMUI_PWD}
        if create_UI_proxy ${USERNAME} ${PASSWORD} ${UI_PROXY}
        then
            stdout "Successfully created UI proxy."
        else
            tear_down_kube_secret ${UI_PROXY}
            stderr
        fi
    fi

    if [ ${USE_CAAS} == "false" ]; then
        if create_API_config ${VAULT_ENV} ${API_CONFIG} ${VAULT_TOKEN_FILE}
        then
            stdout "Successfully created API config."
        else
            tear_down_kube_secret ${API_CONFIG}
            stderr
        fi
    fi

    line
    render_UI_config ${CLIENT_ID}

    line
    render_NGINX_conf ${JMUI_TAG} ${USE_PROXY}

    if create_jm_configmap_obj ${JM_CONFIGMAP_OBJ} ${USE_CAAS}
    then
        stdout "Successfully created UI configMap object."
    else
        tear_down_kube_configMap ${JM_CONFIGMAP_OBJ}
        stderr
    fi

    line
    apply_kube_service

    line
    apply_kube_deployment ${CROMWELL_URL} ${API_DOCKER_IMAGE} ${API_CONFIG} ${JM_CONFIGMAP_OBJ} ${UI_DOCKER_IMAGE} ${UI_PROXY} ${USE_CAAS} ${USE_PROXY}

#    line
#    Each re-deployment to the ingress will cause a ~10 minuted downtime to the Job Manager. So this script assumes that you have created your ingress before using this it. This functions is here just for completeness.
#    TODO: Add back the ingress set up step if needed
#    apply_kube_ingress ${TLS_SECRET_NAME}

    line
    tear_down_rendered_files
}

# Main Runner:
error=0
if [ -z $1 ]; then
    echo -e "\nYou must specify a gcloud project to use for the deployment!"
    error=1
fi

if [ -z $2 ]; then
    echo -e "\nYou must specify the gke context to use for the deployment! E.g. gke_{gcloud-project-id}_{zone}_{clustername}"
    error=1
fi

if [ -z $3 ]; then
    echo -e "\nYou must specify a Job Manager Git Tag!"
    error=1
fi

if [ -z $4 ]; then
    echo -e "\nYou must specify the url for the Cromwell instance to use with the Job Manager UI!"
    error=1
fi

if [ -z $5 ]; then
    echo -e "\nYou must specify whether to use Cromwell-as-a-Service with Job Manager UI!"
    error=1
fi

if [ -z $6 ]; then
    echo -e "\nYou must specify whether to use a UI proxy!"
    error=1
fi

if [ -z $7 ]; then
    echo -e "\nYou must specify a desired username for Job Manager UI in order to use a UI proxy!"
    error=1
fi

if [ -z $8 ]; then
    echo -e "\nYou must specify a desired password for Job Manager UI in order to use a UI proxy!"
    error=1
fi

if [ -z $9 ]; then
    echo -e "\nYou must specify the deployment environment for retrieving Cromwell credentials from vault, if not using Cromwell-as-a-Service!"
    error=1
fi

if [ -z ${10} ]; then
    echo -e "\nYou must specify a Client ID if authentication is required in the capabilities config, using default value ''."
fi

if [ -z ${11} ]; then
    echo -e "\nMissing the Vault token file parameter, using default value $HOME/.vault-token. Otherwise, pass in the path to the token file as the 9th argument of this script!"
fi


if [ $error -eq 1 ]; then
    echo -e "\nUsage: bash deploy.sh GCLOUD_PROJECT GKE_CONTEXT JMUI_TAG CROMWELL_URL USE_CAAS USE_PROXY JMUI_USR JMUI_PWD VAULT_ENV(dev/staging/test) CLIENT_ID(optional) VAULT_TOKEN_FILE(optional)\n"
    exit 1
fi

main $1 $2 $3 $4 $5 $6 $7 $8 $9 ${10} ${11}
