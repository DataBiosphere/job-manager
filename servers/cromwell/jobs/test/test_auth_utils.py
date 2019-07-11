# coding: utf-8

from __future__ import absolute_import
import requests_mock
from . import BaseTestCase


class TestAuthUtils(BaseTestCase):
    def setUp(self):
        self.base_url = 'https://test-cromwell.org'

    @requests_mock.mock()
    def test_token_auth_returns_200(self, mock_request):
        self.app.config.update({
            'cromwell_url': self.base_url,
            'cromwell_user': '',
            'cromwell_password': '',
            'use_caas': True,
            'capabilities': {}
        })

        def _request_callback(request, context):
            context.status_code = 200
            return {'results': [], 'totalResultsCount': 0}

        query_url = self.base_url + '/query'
        mock_request.post(query_url, json=_request_callback)

        response = self.client.open('/jobs/query',
                                    method='POST',
                                    headers={'Authentication': 'Bearer 12345'},
                                    data={},
                                    content_type='application/json')
        self.assertStatus(response, 200)

    @requests_mock.mock()
    def test_basic_auth_returns_200(self, mock_request):
        self.app.config.update({
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

        response = self.client.open('/jobs/query',
                                    method='POST',
                                    data={},
                                    content_type='application/json')
        self.assertStatus(response, 200)

    def test_no_auth_with_caas_returns_401(self):
        self.app.config.update({
            'cromwell_url': self.base_url,
            'cromwell_user': '',
            'cromwell_password': '',
            'use_caas': True,
            'capabilities': {}
        })
        response = self.client.open('/jobs/query',
                                    method='POST',
                                    data={},
                                    content_type='application/json')
        self.assertStatus(response, 401)


if __name__ == '__main__':
    import unittest
    unittest.main()
