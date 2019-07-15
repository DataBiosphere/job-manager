from __future__ import absolute_import

from jobs.test.base_google_test_cases import BaseGoogleTestCases


class TestJobsControllerGoogle(BaseGoogleTestCases.BaseGoogleTestCase):
    """ JobsController integration tests for the google provider """
    def create_app(self):
        app = super(TestJobsControllerGoogle, self).create_app()
        app.config.update({
            'PROVIDER_TYPE': 'google',
            'REQUIRES_AUTH': False,
        })
        return app


if __name__ == '__main__':
    unittest.main()
