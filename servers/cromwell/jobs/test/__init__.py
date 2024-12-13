import logging

import connexion
from connexion.jsonifier import Jsonifier
from flask_testing import TestCase

from ..encoder import JSONEncoder


class BaseTestCase(TestCase):

    def create_app(self):
        logging.getLogger('connexion.operation').setLevel('ERROR')
        options = connexion.options.SwaggerUIOptions(swagger_ui=False)
        app = connexion.App(__name__,
                            specification_dir='../swagger/',
                            swagger_ui_options=options,
                            jsonifier=Jsonifier(cls=JSONEncoder))
        app.add_api('swagger.yaml',
                    jsonifier=Jsonifier(cls=JSONEncoder))
        return app
