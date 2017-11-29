# coding: utf-8

from __future__ import absolute_import

import json
import sys
import requests_mock
from flask import json
from datetime import datetime
from . import BaseTestCase

from jobs.models.query_jobs_request import QueryJobsRequest
from jobs.models.query_jobs_result import QueryJobsResult
from jobs.models.update_job_labels_request import UpdateJobLabelsRequest
from jobs.models.update_job_labels_response import UpdateJobLabelsResponse
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
                'status':
                'error',
                'message':
                'Couldn\'t abort {} because no workflow with that ID is in progress'.
                format(workflow_id)
            }

        # mock cromwell response
        abort_url = self.base_url + '/{id}/abort'.format(id=workflow_id)
        mock_request.post(abort_url, json=_request_callback)

        response = self.client.open(
            '/jobs/{id}/abort'.format(id=workflow_id), method='POST')
        self.assertStatus(response, 404)

    @requests_mock.mock()
    def test_update_job_labels_returns_200(self, mock_request):
        """
        Test case for update_job_labels.

        Update job's labels. Currently Cromwell will ONLY return the UPDATED labels instead of ALL labels of the job.
        """
        workflow_id = 'id'

        def _request_callback(request, context):
            context.status_code = 200
            return {
                "labels": {"test_label": "test_label_value"}
            }

        # mock Cromwell response
        update_label_url = self.base_url + '/{id}/labels'.format(id=workflow_id)
        mock_request.patch(update_label_url, json=_request_callback)

        payload = UpdateJobLabelsRequest(labels={"test_label": "test_label_value"})
        response = self.client.open(
            '/jobs/{id}/updateLabels'.format(id=workflow_id),
            method='POST',
            data=json.dumps(payload),
            content_type='application/json'
        )
        self.assertStatus(response, 200)
        self.assertEquals(response.json, {"labels": {"test_label": "test_label_value"}})

    @requests_mock.mock()
    def test_update_job_labels_bad_request(self, mock_request):
        workflow_id = 'id'
        error_message = "Invalid label: `` did not match the regex [a-z]([-a-z0-9]*[a-z0-9])?."

        def _request_callback(request, context):
            context.status_code = 400
            return {
                "status": "fail",
                "message": error_message
            }

        # mock Cromwell response
        update_label_url = self.base_url + '/{id}/labels'.format(id=workflow_id)
        mock_request.patch(update_label_url, json=_request_callback)

        payload = UpdateJobLabelsRequest(labels={"": "test_invalid_label"})
        response = self.client.open(
            '/jobs/{id}/updateLabels'.format(id=workflow_id),
            method='POST',
            data=json.dumps(payload),
            content_type='application/json'
        )
        self.assertStatus(response, 400)
        self.assertEquals(json.loads(response.data)['detail'], error_message)

    @requests_mock.mock()
    def test_update_job_labels_internal_server_error(self, mock_request):
        workflow_id = 'id'
        error_message = "Unrecognized workflow ID: 12345678-aaaa-bbbb-cccc-dddddddddddd"

        def _request_callback(request, context):
            context.status_code = 500
            return {
                "status": "error",
                "message": error_message
            }

        # mock Cromwell response
        update_label_url = self.base_url + '/{id}/labels'.format(id=workflow_id)
        mock_request.patch(update_label_url, json=_request_callback)

        payload = UpdateJobLabelsRequest(labels={"test_label": "test_label_value"})
        response = self.client.open(
            '/jobs/{id}/updateLabels'.format(id=workflow_id),
            method='POST',
            data=json.dumps(payload),
            content_type='application/json'
        )
        self.assertStatus(response, 500)
        self.assertEquals(json.loads(response.data)['detail'], error_message)

    @requests_mock.mock()
    def test_get_job_returns_200(self, mock_request):
        """
        Test case for get_job

        Query for job and task-level metadata for a specified job
        """
        workflow_id = 'id'
        workflow_name = 'test'
        status = 'Succeeded'
        timestamp = '2017-11-08T05:06:41.424Z'
        response_timestamp = '2017-11-08T05:06:41.424000Z'
        inputs = {'test.inputs': 'gs://project-bucket/test/inputs.txt'}
        outputs = {
            'test.analysis.outputs': 'gs://project-bucket/test/outputs.txt'
        }
        labels = {'cromwell-workflow-id': 'cromwell-12345'}
        job_id = 'operations/abcde'
        std_err = '/cromwell/cromwell-executions/id/call-analysis/stderr'
        std_out = '/cromwell/cromwell-executions/id/call-analysis/stdout'
        attempts = 1
        return_code = 0

        def _request_callback(request, context):
            context.status_code = 200
            return {
                'workflowName':
                workflow_name,
                'id':
                workflow_id,
                'status':
                status,
                'calls': {
                    'test.analysis': [{
                        'jobId': job_id,
                        'executionStatus': 'Done',
                        'start': timestamp,
                        'end': timestamp,
                        'stderr': std_err,
                        'stdout': std_out,
                        'returnCode': return_code,
                        'inputs': inputs,
                        'attempt': attempts
                    }]
                },
                'inputs':
                inputs,
                'labels':
                labels,
                'outputs':
                outputs,
                'submission':
                timestamp,
                'end':
                timestamp,
                'start':
                timestamp,
                'failures': [{
                    'causedBy': [],
                    'message': 'Task test.analysis failed'
                }]
            }

        cromwell_url = self.base_url + '/{id}/metadata'.format(id=workflow_id)
        mock_request.get(cromwell_url, json=_request_callback)

        response = self.client.open(
            '/jobs/{id}'.format(id=workflow_id), method='GET')
        self.assertStatus(response, 200)
        response_data = json.loads(response.data)
        expected_data = {
            'name':
            workflow_name,
            'id':
            workflow_id,
            'status':
            status,
            'submission':
            response_timestamp,
            'start':
            response_timestamp,
            'end':
            response_timestamp,
            'inputs':
            jobs_controller.update_key_names(inputs),
            'outputs':
            jobs_controller.update_key_names(outputs),
            'labels':
            labels,
            'failures': [{
                'failure': 'Task test.analysis failed'
            }],
            'tasks': [{
                'name': 'analysis',
                'jobId': job_id,
                'executionStatus': 'Succeeded',
                'start': response_timestamp,
                'end': response_timestamp,
                'stderr': std_err,
                'stdout': std_out,
                'inputs': jobs_controller.update_key_names(inputs),
                'returnCode': return_code,
                'attempts': attempts
            }]
        }
        self.assertDictEqual(response_data, expected_data)

    @requests_mock.mock()
    def test_get_job_bad_request(self, mock_request):
        workflow_id = 'id'
        error_message = 'Invalid workflow ID: {}.'.format(workflow_id)

        def _request_callback(request, context):
            context.status_code = 400
            return {'status': 'fail', 'message': error_message}

        cromwell_url = self.base_url + '/{id}/metadata'.format(id=workflow_id)
        mock_request.get(cromwell_url, json=_request_callback)

        response = self.client.open(
            '/jobs/{id}'.format(id=workflow_id), method='GET')
        self.assertStatus(response, 400)
        self.assertEquals(json.loads(response.data)['detail'], error_message)

    @requests_mock.mock()
    def test_job_not_found(self, mock_request):
        workflow_id = 'id'
        error_message = 'Unrecognized workflow ID: {}.'.format(workflow_id)

        def _request_callback(request, context):
            context.status_code = 404
            return {'status': 'fail', 'message': error_message}

        cromwell_url = self.base_url + '/{id}/metadata'.format(id=workflow_id)
        mock_request.get(cromwell_url, json=_request_callback)

        response = self.client.open(
            '/jobs/{id}'.format(id=workflow_id), method='GET')
        self.assertStatus(response, 404)
        self.assertEquals(json.loads(response.data)['detail'], error_message)

    @requests_mock.mock()
    def test_job_internal_server_error(self, mock_request):
        workflow_id = 'id'
        error_message = 'Connection to the database failed.'

        def _request_callback(request, context):
            context.status_code = 500
            return {'status': 'error', 'message': error_message}

        cromwell_url = self.base_url + '/{id}/metadata'.format(id=workflow_id)
        mock_request.get(cromwell_url, json=_request_callback)

        response = self.client.open(
            '/jobs/{id}'.format(id=workflow_id), method='GET')
        self.assertStatus(response, 500)
        self.assertEquals(json.loads(response.data)['detail'], error_message)

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
