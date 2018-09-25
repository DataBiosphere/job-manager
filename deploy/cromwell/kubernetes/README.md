# Job Manager

This folder hosts the config files and script for deploying the Job Manager on GreenBox's Cromwell instance. 

## Available Environments
- dev
- staging
- integration
- caas-dev
- prod: _No production deployments yet_

## Deployment Process

To deploy the Job Manager, please checkout this repository and:

1. Make sure your deployment environment is authenticated with Vault.

2. Make sure you have created the ingress for the job-manager in advance, refer to `job-manager-ingress.yaml.ctmpl` for the content of the ingress YAML file.
Use `kubectl apply -f job-manager-ingress.yaml` to apple the ingress.

3. Make sure the following files exist in the same directory with `deploy.sh`:
    - `api-config.json.ctmpl`
    - `capabilities_config.json` or `capabilities_config_caas.json`
    - `ui-config.json.ctmpl`
    - `nginx.conf.ctmpl`
    - `job-manager-deployment.yaml.ctmpl`
    - `job-manager-service.yaml`
    - `gunicorn_args.txt`

4. Make sure the following CLIs installed and configured in your current working environment correctly:
    - `kubectl`
    - `docker`
    - `htpasswd`

5. Make sure your have a valid Vault token file exists in `$HOME/.vault-token`.
Otherwise you need to pass the path to the token file as the 5th argument of `deploy.sh` later.

6. Run the following command with arguments:

    - `bash deploy.sh ENV(dev/staging/test) GIT_TAG USERNAME PASSWORD VAULT_TOKEN_FILE(optional)`

7. Check the `/version` and `/health` endpoints of the deployed UI to validate the deployment.
