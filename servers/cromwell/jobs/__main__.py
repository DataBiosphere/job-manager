#!/usr/bin/env python

import argparse
import os
import json
import connexion
from .encoder import JSONEncoder
import requests
from requests.auth import HTTPBasicAuth

parser = argparse.ArgumentParser()
parser.add_argument(
    '--cromwell_url',
    type=str,
    help='Url for fetching data from cromwell',
    default=os.environ.get('CROMWELL_URL'))
parser.add_argument(
    '--path_prefix',
    type=str,
    help='Path prefix, e.g. /api/v1, to serve from',
    default=os.environ.get('PATH_PREFIX'))

if __name__ == '__main__':
    parser.add_argument(
        '--port',
        type=int,
        default=8190,
        help='The port on which to serve HTTP requests')
    args = parser.parse_args()
else:
    # Allow unknown args if we aren't the main program, these include flags to
    # gunicorn.
    args, _ = parser.parse_known_args()

app = connexion.App(__name__, specification_dir='./swagger/', swagger_ui=False)
DEFAULT_CROMWELL_CREDENTIALS = {"cromwell_user": "", "cromwell_password": ""}
LOADER_ERR_MSG = "Failed to load config.json, using the default config: {0}".format(
    DEFAULT_CROMWELL_CREDENTIALS)

# Load credentials for cromwell
config_path = os.environ.get('CROMWELL_CREDENTIALS')

# Check if the credentials are provided properly
try:
    with open(config_path) as f:
        config = json.load(f)
except (IOError, TypeError):
    print(LOADER_ERR_MSG)
    config = DEFAULT_CROMWELL_CREDENTIALS
finally:
    app.app.config.update(config)

app.app.config['cromwell_url'] = args.cromwell_url
app.app.json_encoder = JSONEncoder
app.add_api('swagger.yaml', base_path=args.path_prefix)


def run():
    # Check the connections with cromwell
    try:
        response = requests.head(
            args.cromwell_url,
            auth=HTTPBasicAuth(app.app.config["cromwell_user"],
                               app.app.config["cromwell_password"]),
            timeout=5)
        if response.status_code == 401:
            raise requests.exceptions.HTTPError(
                "Invalid credentials for the Cromwell: {0}".format(
                    args.cromwell_url))
        else:
            return app.app
    except requests.exceptions.RequestException as err:
        print(err)
        print("Failed to connect to Cromwell: {0}".format(args.cromwell_url))
