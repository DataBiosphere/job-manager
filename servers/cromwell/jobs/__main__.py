#!/usr/bin/env python

import argparse
import os
import json
import connexion
from .encoder import JSONEncoder
import requests
from requests.auth import HTTPBasicAuth
import logging
from .models.capabilities_response import CapabilitiesResponse

CROMWELL_LABEL_MIN_LENGTH = 1
CROMWELL_LABEL_MAX_LENGTH = 256
LABELS_PREFIX = 'labels.'

logging.basicConfig(level=logging.WARNING)
logger = logging.getLogger('{module_path}'.format(module_path=__name__))

parser = argparse.ArgumentParser()
parser.add_argument('--cromwell_url',
                    type=str,
                    help='Url for fetching data from cromwell',
                    default=os.environ.get('CROMWELL_URL'))
parser.add_argument(
    '--use_caas',
    type=str,
    help='Whether the cromwell backend is using cromwell-as-a-service',
    default=os.environ.get('USE_CAAS'))
parser.add_argument('--path_prefix',
                    type=str,
                    help='Path prefix, e.g. /api/v1, to serve from',
                    default=os.environ.get('PATH_PREFIX'))

if __name__ == '__main__':
    parser.add_argument('--port',
                        type=int,
                        default=8190,
                        help='The port on which to serve HTTP requests')
    args = parser.parse_args()
else:
    # Allow unknown args if we aren't the main program, these include flags to
    # gunicorn.
    args, _ = parser.parse_known_args()

app = connexion.App(__name__, specification_dir='./swagger/', swagger_ui=False)
DEFAULT_CROMWELL_CREDENTIALS = {'cromwell_user': '', 'cromwell_password': ''}

# Load credentials for cromwell
config_path = os.environ.get('CROMWELL_CREDENTIALS')

# Set path to capabilities config
capabilities_path = os.environ.get('CAPABILITIES_CONFIG')

# Check if the credentials are provided properly
try:
    with open(config_path) as f:
        config = json.load(f)
except (IOError, TypeError):
    logger.warning(
        'Failed to load credentials file, using the default config: {}'.format(
            DEFAULT_CROMWELL_CREDENTIALS))
    config = DEFAULT_CROMWELL_CREDENTIALS
finally:
    app.app.config.update(config)

# Try to load the capabilities config file
try:
    with open(capabilities_path) as f:
        capabilities_config = json.load(f)
    for settings in capabilities_config['displayFields']:
        if settings['field'].startswith(LABELS_PREFIX):
            if len(settings['field']) == len(LABELS_PREFIX) or len(
                    settings['field']
            ) > len(LABELS_PREFIX) + CROMWELL_LABEL_MAX_LENGTH:
                raise ValueError(
                    'Custom capabilities config contained invalid label key')
    logger.info('Successfully loaded the custom capabilities config.')
    app.app.config['capabilities'] = CapabilitiesResponse.from_dict(
        capabilities_config)
except (IOError, TypeError):
    logger.warning(
        'Failed to load capabilities config, using default display fields.')

app.app.config['cromwell_url'] = args.cromwell_url
app.app.config['use_caas'] = args.use_caas and args.use_caas.lower() == 'true'
app.app.json_encoder = JSONEncoder
app.add_api('swagger.yaml', base_path=args.path_prefix)


def run():
    # Check the connections with cromwell
    if not app.app.config['use_caas']:
        try:
            response = requests.head(args.cromwell_url,
                                     auth=HTTPBasicAuth(
                                         app.app.config['cromwell_user'],
                                         app.app.config['cromwell_password']),
                                     timeout=5)
            if response.status_code == 401:
                raise requests.exceptions.HTTPError(
                    'Invalid credentials for the Cromwell: {}'.format(
                        args.cromwell_url))
        except KeyError:
            logger.error('Invalid config.json file provided.')
        except requests.exceptions.RequestException as err:
            logger.critical(err)
            logger.critical('Failed to connect to Cromwell: {}'.format(
                args.cromwell_url))
    return app.app
