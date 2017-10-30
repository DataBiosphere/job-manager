# coding: utf-8

from __future__ import absolute_import

import requests_mock
from flask import json
from datetime import datetime
from . import BaseTestCase

from jobs.models.query_jobs_request import QueryJobsRequest
from jobs.models.query_jobs_result import QueryJobsResult
from jobs.controllers import jobs_controller


class TestJobsController(BaseTestCase):
    """ JobsController integration test stubs """

    def test_abort_job_returns_200(self):
        """
        Test case for abort_job

        Abort a job by ID
        """
        response = self.client.open('/jobs/{id}/abort'.format(id='id_example'), method='POST')
        self.assertStatus(response, 200)

    def test_get_job_returns_200(self):
        """
        Test case for get_job

        Query for job and task-level metadata for a specified job
        """
        response = self.client.open('/jobs/{id}'.format(id='id_example'), method='GET')
        self.assertStatus(response, 200)

    @requests_mock.mock()
    def test_query_jobs_returns_200(self, mock_request):
        """
        Test case for query_jobs

        Query jobs by various filter criteria. Returned jobs are ordered from newest to oldest submission time.
        """
        self.app.config.update({
            'cromwell_url': 'https://cromwell.mint-dev.broadinstitute.org/api/workflows/v1',
            'cromwell_user': 'user',
            'cromwell_password': 'password'
        })

        def _request_callback(request, context):
            context.status_code = 200
            return {'results': []}

        # mock cromwell response
        query_url = 'https://cromwell.mint-dev.broadinstitute.org/api/workflows/v1/query'
        mock_request.post(query_url, json=_request_callback)

        query = QueryJobsRequest()
        response = self.client.open('/jobs/query',
                                    method='POST',
                                    data=json.dumps(query),
                                    content_type='application/json')
        self.assertStatus(response, 200)

    def test_format_job(self):
        time = '2017-10-27T18:04:47.271Z'
        job = {
            'id': '12345',
            'name': 'TestJob',
            'status': 'Failed',
            'submission': time,
            'start': time,
            'end': time
        }
        formatted_time = datetime.strptime(time, '%Y-%m-%dT%H:%M:%S.%fZ')
        result = QueryJobsResult(
            id=job.get('id'),
            name=job.get('name'),
            status=job.get('status'),
            submission=formatted_time,
            start=formatted_time,
            end=formatted_time
        )
        self.assertEqual(jobs_controller.format_job(job), result)


if __name__ == '__main__':
    import unittest
    unittest.main()
