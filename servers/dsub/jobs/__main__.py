#!/usr/bin/env python

import argparse
import connexion
import logging
import os
from flask_cors import CORS
from .encoder import JSONEncoder

app = connexion.App(__name__, specification_dir='./swagger/', swagger_ui=False)
app.app.json_encoder = JSONEncoder
app.add_api('swagger.yaml')

# Log to stderr.
handler = logging.StreamHandler()
handler.setLevel(logging.INFO)
app.app.logger.addHandler(handler)
app.app.logger.setLevel(logging.INFO)

# gunicorn flags are passed via env variables, so we use these as the default
# values. These arguments will rarely be specified as flags directly, aside from
# occasional use during local debugging.
parser = argparse.ArgumentParser()
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

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=args.port)
