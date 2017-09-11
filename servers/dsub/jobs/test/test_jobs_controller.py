# coding: utf-8

from __future__ import absolute_import

from jobs.models.job_abort_response import JobAbortResponse
from jobs.models.job_metadata_response import JobMetadataResponse
from jobs.models.job_query_parameter import JobQueryParameter
from jobs.models.job_query_response import JobQueryResponse
from . import BaseTestCase
from six import BytesIO
from flask import json


class TestJobsController(BaseTestCase):
    """ DefaultController integration test stubs """

    def test_jobs_id_abort_post(self):
        """
        Test case for jobs_id_abort_post

        Abort a job by ID
        """
        response = self.client.open(
            '/jobs/{id}/abort'.format(id='id_example'), method='POST')
        self.assert200(response,
                       "Response body is : " + response.data.decode('utf-8'))

    def test_jobs_id_get(self):
        """
        Test case for jobs_id_get

        Query for job and task-level metadata for a specified job
        """
        response = self.client.open(
            '/jobs/{id}'.format(id='id_example'), method='GET')
        self.assert200(response,
                       "Response body is : " + response.data.decode('utf-8'))

    def test_jobs_query_post(self):
        """
        Test case for jobs_query_post

        Query jobs by start dates, end dates, names, ids, or statuses.
        """
        parameters = [JobQueryRequest()]
        response = self.client.open(
            '/jobs/query',
            method='POST',
            data=json.dumps(parameters),
            content_type='application/json')
        self.assert200(response,
                       "Response body is : " + response.data.decode('utf-8'))


if __name__ == '__main__':
    import unittest
    unittest.main()
