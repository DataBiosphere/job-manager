#!/usr/bin/env python

import argparse
import os
import json
import connexion
from .encoder import JSONEncoder

if __name__ == '__main__':
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
    parser.add_argument(
        '--port',
        type=int,
        default=8190,
        help='The port on which to serve HTTP requests')
    args = parser.parse_args()

    app = connexion.App(
        __name__, specification_dir='./swagger/', swagger_ui=False)
    config_path = os.environ.get('CROMWELL_CREDENTIALS')
    with open(config_path) as f:
        config = json.load(f)
        app.app.config.update(config)
    app.app.config['cromwell_url'] = args.cromwell_url
    app.app.json_encoder = JSONEncoder
    app.add_api('swagger.yaml', base_path=args.path_prefix)
    app.run(host='0.0.0.0', port=args.port)
