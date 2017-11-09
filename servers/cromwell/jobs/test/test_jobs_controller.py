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

    def setUp(self):
        self.base_url = 'https://test-cromwell.org'
        self.app.config.update({
            'cromwell_url': self.base_url,
            'cromwell_user': 'user',
            'cromwell_password': 'password'
        })

    @requests_mock.mock()
    def test_abort_job(self, mock_request):
        """
        Test case for abort_job

        Abort a job by ID
        """
        workflow_id = 'id'

        def _request_callback(request, context):
            context.status_code = 200

        abort_url = self.base_url + '/{id}/abort'.format(id=workflow_id)
        mock_request.post(abort_url, json=_request_callback)

        response = self.client.open(
            '/jobs/{id}/abort'.format(id=workflow_id), method='POST')
        self.assertStatus(response, 200)

    @requests_mock.mock()
    def test_abort_job_not_found(self, mock_request):
        """Test that aborting a job that is not running returns a 404 response."""
        workflow_id = 'id'

        def _request_callback(request, context):
            context.status_code = 404
            return {
                "status":
                "error",
                "message":
                "Couldn't abort {} because no workflow with that ID is in progress".
                format(workflow_id)
            }

        # mock cromwell response
        abort_url = self.base_url + '/{id}/abort'.format(id=workflow_id)
        mock_request.post(abort_url, json=_request_callback)

        response = self.client.open(
            '/jobs/{id}/abort'.format(id=workflow_id), method='POST')
        self.assertStatus(response, 404)

    @requests_mock.mock()
    def test_get_job_returns_200(self, mock_request):
        """
        Test case for get_job

        Query for job and task-level metadata for a specified job
        """
        workflow_id = 'id'

        def _request_callback(request, context):
            context.status_code = 200
            return {
                "workflowName": "test",
                "id": workflow_id,
                "calls": {
                    "test.analysis": [{
                        "jobId": "operations/abcde",
                        "executionStatus": "Done",
                        "start": "2015-12-11T16:53:22.000-05:00",
                        "end": "2015-12-11T16:53:23.000-05:00",
                        "stderr": "/cromwell/cromwell-executions/id/call-analysis/stderr",
                        "stdout": "/cromwell/cromwell-executions/id/call-analysis/stdout",
                        "returnCode": 0,
                        "inputs": {
                            "test.inputs": "gs://project-bucket/test/inputs.txt"
                        }
                    }]
                },
                "inputs": {
                    "test.inputs": "gs://project-bucket/test/inputs.txt"
                },
                "labels": {
                    "cromwell-workflow-id": "cromwell-12345"
                },
                "outputs": {
                    "test.analysis.outputs": "gs://project-bucket/test/outputs.txt"
                },
                "submission": "2015-12-11T16:53:21.000-05:00",
                "status": "Succeeded",
                "end": "2015-12-11T16:53:23.000-05:00",
                "start": "2015-12-11T16:53:21.000-05:00"
            }

        cromwell_url = self.base_url + '/{id}/metadata'.format(id=workflow_id)
        mock_request.get(cromwell_url, json=_request_callback)

        response = self.client.open(
            '/jobs/{id}'.format(id=workflow_id), method='GET')
        self.assertStatus(response, 200)

    @requests_mock.mock()
    def test_get_job_bad_request(self, mock_request):
        workflow_id = 'id'

        def _request_callback(request, context):
            context.status_code = 400
            return {
                "status": "fail",
                "message": "Invalid workflow ID: {}.".format(workflow_id)
            }

        cromwell_url = self.base_url + '/{id}/metadata'.format(id=workflow_id)
        mock_request.get(cromwell_url, json=_request_callback)

        response = self.client.open(
            '/jobs/{id}'.format(id=workflow_id), method='GET')
        self.assertStatus(response, 400)

    @requests_mock.mock()
    def test_job_not_found(self, mock_request):
        workflow_id = 'id'

        def _request_callback(request, context):
            context.status_code = 404
            return {
                "status": "fail",
                "message": "Unrecognized workflow ID: {}.".format(workflow_id)
            }

        cromwell_url = self.base_url + '/{id}/metadata'.format(id=workflow_id)
        mock_request.get(cromwell_url, json=_request_callback)

        response = self.client.open(
            '/jobs/{id}'.format(id=workflow_id), method='GET')
        self.assertStatus(response, 404)

    @requests_mock.mock()
    def test_job_internal_server_error(self, mock_request):
        workflow_id = 'id'

        def _request_callback(request, context):
            context.status_code = 500
            return {
                "status": "error",
                "message": "Connection to the database failed."
            }

        cromwell_url = self.base_url + '/{id}/metadata'.format(id=workflow_id)
        mock_request.get(cromwell_url, json=_request_callback)

        response = self.client.open(
            '/jobs/{id}'.format(id=workflow_id), method='GET')
        self.assertStatus(response, 500)

    @requests_mock.mock()
    def test_query_jobs_returns_200(self, mock_request):
        """
        Test case for query_jobs

        Query jobs by various filter criteria. Returned jobs are ordered from newest to oldest submission time.
        """

        def _request_callback(request, context):
            context.status_code = 200
            return {'results': []}

        # mock cromwell response
        query_url = self.base_url + '/query'
        mock_request.post(query_url, json=_request_callback)

        query = QueryJobsRequest()
        response = self.client.open(
            '/jobs/query',
            method='POST',
            data=json.dumps(query),
            content_type='application/json')
        self.assertStatus(response, 200)

    def test_format_empty_query_json(self):
        query = QueryJobsRequest()
        self.assertEqual(jobs_controller.format_query_json(query), [])

    def test_format_query_json(self):
        query = QueryJobsRequest(
            name='test',
            start='2017-10-30T18:04:47.271Z',
            end='2017-10-31T18:04:47.271Z',
            statuses=['Submitted', 'Running', 'Succeeded'])
        formatted_query = [{
            'name': query.name
        }, {
            'start': query.start
        }, {
            'end': query.end
        }]
        formatted_query.extend([{'status': s} for s in query.statuses])
        self.assertItemsEqual(formatted_query,
                              jobs_controller.format_query_json(query))

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
            end=formatted_time)
        self.assertEqual(jobs_controller.format_job(job), result)

    def test_format_job_without_milliseconds(self):
        time = '2017-10-27T18:04:47Z'
        job = {
            'id': '12345',
            'name': 'TestJob',
            'status': 'Failed',
            'submission': time,
            'start': time,
            'end': time
        }
        formatted_time = datetime.strptime(time, '%Y-%m-%dT%H:%M:%SZ')
        result = QueryJobsResult(
            id=job.get('id'),
            name=job.get('name'),
            status=job.get('status'),
            submission=formatted_time,
            start=formatted_time,
            end=formatted_time)
        self.assertEqual(jobs_controller.format_job(job), result)

    def test_format_job_with_no_end_date(self):
        time = '2017-10-27T18:04:47Z'
        job = {
            'id': '12345',
            'name': 'TestJob',
            'status': 'Failed',
            'submission': time,
            'start': time
        }
        formatted_time = datetime.strptime(time, '%Y-%m-%dT%H:%M:%SZ')
        result = QueryJobsResult(
            id=job.get('id'),
            name=job.get('name'),
            status=job.get('status'),
            submission=formatted_time,
            start=formatted_time,
            end=None)
        self.assertEqual(jobs_controller.format_job(job), result)


if __name__ == '__main__':
    import unittest
    unittest.main()
