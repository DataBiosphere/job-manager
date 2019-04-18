#!/usr/bin/env python

import argparse
import connexion
import logging
import os
from flask_cors import CORS
from .encoder import JSONEncoder


def split_env_flag(name):
    """Converts a comma-delimited env var into a list.

    Args:
      name: (str) the name of the environment variable

    Returns:
      (list<str>) the elements of the comma-delimited list, or an empty list if
        the env variable is empty or unset
    """
    if name not in os.environ or os.environ[name] is '':
        return []
    return os.environ[name].split(',')


# gunicorn flags are passed via env variables, so we use these as the default
# values. These arguments will rarely be specified as flags directly, aside from
# occasional use during local debugging.
parser = argparse.ArgumentParser()
parser.add_argument('--provider_type',
                    type=str,
                    help='The dsub provider type to use for managing jobs',
                    default=os.environ.get('PROVIDER_TYPE'))
parser.add_argument('--path_prefix',
                    type=str,
                    help='Path prefix, e.g. /api/v1, to serve from',
                    default=os.environ.get('PATH_PREFIX'))
parser.add_argument(
    '--allow_origins',
    type=str,
    nargs='+',
    help='Origins to allow for CORS; defaults to CORS disabled',
    default=split_env_flag('ALLOW_ORIGINS'))
parser.add_argument('--requires_auth',
                    type=int,
                    help='Boolean indicating if authentication is required',
                    default=os.environ.get('REQUIRES_AUTH'))

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
app.app.config['PROVIDER_TYPE'] = args.provider_type
app.app.config['REQUIRES_AUTH'] = bool(args.requires_auth)
if args.allow_origins:
    prefix = args.path_prefix or ''
    CORS(app.app,
         resources={
             prefix + '/*': {
                 'origins': args.allow_origins,
             },
         })

# Log to stderr.
handler = logging.StreamHandler()
handler.setLevel(logging.INFO)
app.app.logger.addHandler(handler)
app.app.logger.setLevel(logging.INFO)

app.app.json_encoder = JSONEncoder
app.add_api('swagger.yaml', base_path=args.path_prefix)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=args.port)
