#!/usr/bin/env python

import os
import json
import connexion
from .encoder import JSONEncoder


if __name__ == '__main__':
    app = connexion.App(__name__, specification_dir='./swagger/')
    config_path = os.environ.get('CROMWELL_CREDENTIALS')
    with open(config_path) as f:
        config = json.load(f)
        app.app.config.update(config)
    app.app.config['cromwell_url'] = 'https://cromwell.mint-dev.broadinstitute.org/api/workflows/v1'
    app.app.json_encoder = JSONEncoder
    app.add_api('swagger.yaml', base_path=os.environ.get('PATH_PREFIX'))
    app.run(host='0.0.0.0', port=8190)
