import logging

import connexion
from flask import json
from connexion.jsonifier import Jsonifier

from ..encoder import JSONEncoder

def create_app():
    logging.getLogger('connexion.operation').setLevel('ERROR')
    options = connexion.options.SwaggerUIOptions(swagger_ui=False)
    app = connexion.App(__name__,
                        specification_dir='../swagger/',
                        swagger_ui_options=options,
                        jsonifier=Jsonifier(cls=JSONEncoder))
    app.add_api('swagger.yaml',
                jsonifier=Jsonifier(cls=JSONEncoder))
    return app

def json_dumps(o):
    return json.dumps(0, cls=JSONEncoder)
