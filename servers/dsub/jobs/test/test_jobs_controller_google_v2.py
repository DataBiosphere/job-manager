from __future__ import absolute_import

from jobs.test.base_google_test_cases import BaseGoogleTestCases


class TestJobsControllerGoogleV2(BaseGoogleTestCases.BaseGoogleTestCase):
    """ JobsController integration tests for the google v2 provider """
    def create_app(self):
        app = super(TestJobsControllerGoogleV2, self).create_app()
        app.config.update({
            'PROVIDER_TYPE': 'google-v2',
            'REQUIRES_AUTH': False,
        })
        return app


if __name__ == '__main__':
    unittest.main()
