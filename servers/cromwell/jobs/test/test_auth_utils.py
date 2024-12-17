# coding: utf-8

from __future__ import absolute_import

from asyncio.log import logger

import requests_mock
import unittest

from . import create_app


class TestAuthUtils(unittest.TestCase):

    def setUp(self):
        self.app = create_app()
        self.base_url = 'https://test-cromwell.org'
        self.client = self.app.test_client()

    def assertStatus(self, response, expectedStatus):
        self.assertEqual(response.status_code, expectedStatus)

    @requests_mock.mock()
    def test_token_auth_returns_200(self, mock_request):
        self.app.app.config.update({
            'cromwell_url': self.base_url,
            'cromwell_user': '',
            'cromwell_password': '',
            'use_caas': True,
            'capabilities': {},
            'include_subworkflows': True
        })

        def _request_callback(request, context):
            context.status_code = 200
            return {'results': [], 'totalResultsCount': 0}

        query_url = self.base_url + '/query'
        mock_request.post(query_url, json=_request_callback)

        response = self.client.post('/jobs/query',
                                    headers={'Authentication': 'Bearer 12345'},
                                    json="{}")
        self.assertStatus(response, 200)

    @requests_mock.mock()
    def test_basic_auth_returns_200(self, mock_request):
        self.app.app.config.update({
            'cromwell_url': self.base_url,
            'cromwell_user': 'user',
            'cromwell_password': 'password',
            'use_caas': False,
            'capabilities': {}
        })

        def _request_callback(request, context):
            context.status_code = 200
            return {'results': [], 'totalResultsCount': 0}

        query_url = self.base_url + '/query'
        mock_request.post(query_url, json=_request_callback)

        response = self.client.post('/jobs/query', json="{}")
        self.assertStatus(response, 200)

    def test_no_auth_with_caas_returns_401(self):
        self.app.app.config.update({
            'cromwell_url': self.base_url,
            'cromwell_user': '',
            'cromwell_password': '',
            'use_caas': True,
            'capabilities': {}
        })
        response = self.client.post('/jobs/query', data="{}")
        self.assertStatus(response, 401)


if __name__ == '__main__':
    import unittest
    unittest.main()
