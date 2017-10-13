from flask_testing import TestCase
from ..encoder import JSONEncoder
import connexion
import logging


class BaseTestCase(TestCase):
    def create_app(self):
        logging.getLogger('connexion.operation').setLevel('ERROR')
        app = connexion.App(__name__, specification_dir='../swagger/')
        app.app.json_encoder = JSONEncoder
        app.add_api('swagger.yaml')
        return app.app

    def assertStatus(self, response, want, desc=None):
        if not desc:
            desc = 'Response body is : ' + response.data.decode('utf-8')
        super(BaseTestCase, self).assertStatus(response, want, desc)
