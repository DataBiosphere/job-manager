# coding: utf-8

from __future__ import absolute_import

import requests_mock
from flask import json
from datetime import datetime
from dateutil.tz import *
import dateutil.parser
from . import BaseTestCase

from jobs.models.extended_fields import ExtendedFields
from jobs.models.query_jobs_request import QueryJobsRequest
from jobs.models.query_jobs_result import QueryJobsResult
from jobs.models.update_job_labels_request import UpdateJobLabelsRequest
from jobs.models.update_job_labels_response import UpdateJobLabelsResponse
from jobs.controllers import jobs_controller


class TestJobsController(BaseTestCase):
    """ JobsController integration test stubs """
    maxDiff = None

    def setUp(self):
        self.base_url = 'https://test-cromwell.org'
        self.app.config.update({
            'cromwell_url': self.base_url,
            'cromwell_user': 'user',
            'cromwell_password': 'password',
            'use_caas': False
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
                'Couldn\'t abort {} because no workflow with that ID is in progress'
                .format(workflow_id)
            }

        abort_url = self.base_url + '/{id}/abort'.format(id=workflow_id)
        mock_request.post(abort_url, json=_request_callback)

        response = self.client.open(
            '/jobs/{id}/abort'.format(id=workflow_id), method='POST')
        self.assertStatus(response, 404)

    @requests_mock.mock()
    def test_update_job_labels_returns_200(self, mock_request):
        """
        Test case for update_job_labels.

        Update job's labels. Currently Cromwell will ONLY return the UPDATED labels instead of ALL labels of the job,
            the Job Manager makes two separate HTTP requests here to Cromwell so that it can get ALL labels.
        """
        workflow_id = 'id'
        workflow_name = 'test'
        status = 'Succeeded'
        timestamp = '2017-11-08T05:06:41.424Z'
        response_timestamp = '2017-11-08T05:06:41.424000+00:00'
        inputs = {'test.inputs': 'gs://project-bucket/test/inputs.txt'}
        outputs = {
            'test.analysis.outputs': 'gs://project-bucket/test/outputs.txt'
        }
        labels = {}
        job_id = 'operations/abcde'
        std_err = '/cromwell/cromwell-executions/id/call-analysis/stderr'
        std_out = '/cromwell/cromwell-executions/id/call-analysis/stdout'
        attempts = 1
        return_code = 0

        def _request_callback_labels(request, context):
            context.status_code = 200
            return {"labels": {"test_label": "test_label_value"}}

        def _request_callback_get_job(request, context):
            context.status_code = 200
            return {
                'workflowName': workflow_name,
                'id': workflow_id,
                'status': status,
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
                'inputs': inputs,
                'labels': labels,
                'outputs': outputs,
                'submission': timestamp,
                'end': timestamp,
                'start': timestamp,
                'failures': [{
                    'causedBy': [],
                    'message': 'Task test.analysis failed'
                }]
            }  # yapf: disable

        update_label_url = self.base_url + '/{id}/labels'.format(
            id=workflow_id)
        cromwell_url = self.base_url + '/{id}/metadata'.format(id=workflow_id)

        mock_request.patch(update_label_url, json=_request_callback_labels)
        mock_request.get(cromwell_url, json=_request_callback_get_job)

        payload = UpdateJobLabelsRequest(
            labels={"test_label": "test_label_value"})
        response = self.client.open(
            '/jobs/{id}/updateLabels'.format(id=workflow_id),
            method='POST',
            data=json.dumps(payload),
            content_type='application/json')
        self.assertStatus(response, 200)
        self.assertEquals(response.json,
                          {"labels": {
                              "test_label": "test_label_value"
                          }})

    @requests_mock.mock()
    def test_update_job_labels_returns_all_labels(self, mock_request):

        workflow_id = 'id'
        workflow_name = 'test'
        status = 'Succeeded'
        timestamp = '2017-11-08T05:06:41.424Z'
        response_timestamp = '2017-11-08T05:06:41.424000+00:00'
        inputs = {'test.inputs': 'gs://project-bucket/test/inputs.txt'}
        outputs = {
            'test.analysis.outputs': 'gs://project-bucket/test/outputs.txt'
        }
        labels = {
            "existing_test_label1": "existing_test_label_value1",
            "existing_test_label2": "existing_test_label_value2"
        }
        job_id = 'operations/abcde'
        std_err = '/cromwell/cromwell-executions/id/call-analysis/stderr'
        std_out = '/cromwell/cromwell-executions/id/call-analysis/stdout'
        attempts = 1
        return_code = 0

        def _request_callback_labels(request, context):
            context.status_code = 200
            return {
                "labels": {
                    "new_test_label": "new_test_label_value",
                    "existing_test_label1": "existing_test_label_value1",
                    "existing_test_label2": "existing_test_label_value2"
                }
            }

        def _request_callback_get_job(request, context):
            context.status_code = 200
            return {
                'workflowName': workflow_name,
                'id': workflow_id,
                'status': status,
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
                'inputs': inputs,
                'labels': labels,
                'outputs': outputs,
                'submission': timestamp,
                'end': timestamp,
                'start': timestamp,
                'failures': [{
                    'causedBy': [],
                    'message': 'Task test.analysis failed'
                }]
            }  # yapf: disable

        update_label_url = self.base_url + '/{id}/labels'.format(
            id=workflow_id)
        cromwell_url = self.base_url + '/{id}/metadata'.format(id=workflow_id)
        mock_request.patch(update_label_url, json=_request_callback_labels)
        mock_request.get(cromwell_url, json=_request_callback_get_job)

        payload = UpdateJobLabelsRequest(
            labels={"new_test_label": "new_test_label_value"})
        response = self.client.open(
            '/jobs/{id}/updateLabels'.format(id=workflow_id),
            method='POST',
            data=json.dumps(payload),
            content_type='application/json')

        expected_result = UpdateJobLabelsResponse.from_dict({
            "labels": {
                "existing_test_label1": "existing_test_label_value1",
                "existing_test_label2": "existing_test_label_value2",
                "new_test_label": "new_test_label_value"
            }
        })

        result = UpdateJobLabelsResponse.from_dict(response.json)

        self.assertStatus(response, 200)
        self.assertDictEqual(result.labels, expected_result.labels)

    @requests_mock.mock()
    def test_update_job_labels_bad_request(self, mock_request):
        workflow_id = 'id'
        error_message = "Invalid label: `` did not match the regex [a-z]([-a-z0-9]*[a-z0-9])?."

        def _request_callback(request, context):
            context.status_code = 400
            return {"status": "fail", "message": error_message}

        update_label_url = self.base_url + '/{id}/labels'.format(
            id=workflow_id)
        mock_request.patch(update_label_url, json=_request_callback)

        payload = UpdateJobLabelsRequest(labels={"": "test_invalid_label"})
        response = self.client.open(
            '/jobs/{id}/updateLabels'.format(id=workflow_id),
            method='POST',
            data=json.dumps(payload),
            content_type='application/json')
        self.assertStatus(response, 400)
        self.assertEquals(json.loads(response.data)['detail'], error_message)

    @requests_mock.mock()
    def test_update_job_labels_internal_server_error(self, mock_request):
        workflow_id = 'id'
        error_message = "Invalid workflow ID: test_invalid_workflow_id"

        def _request_callback(request, context):
            context.status_code = 500
            return {"status": "error", "message": error_message}

        update_label_url = self.base_url + '/{id}/labels'.format(
            id=workflow_id)
        mock_request.patch(update_label_url, json=_request_callback)

        payload = UpdateJobLabelsRequest(
            labels={"test_label": "test_label_value"})
        response = self.client.open(
            '/jobs/{id}/updateLabels'.format(id=workflow_id),
            method='POST',
            data=json.dumps(payload),
            content_type='application/json')
        self.assertStatus(response, 500)
        self.assertEquals(json.loads(response.data)['detail'], error_message)

    @requests_mock.mock()
    def test_update_job_labels_not_found(self, mock_request):
        """Note: This status code is not currently properly returned by the Cromwell actually the error 'Unrecognized
            workflow ID' will return with a status code 500 now, the Cromwell team will address this issue in
            the near future."""
        workflow_id = 'id'
        error_message = "Unrecognized workflow ID: 12345678-aaaa-bbbb-cccc-dddddddddddd"

        def _request_callback(request, context):
            context.status_code = 404
            return {"status": "error", "message": error_message}

        update_label_url = self.base_url + '/{id}/labels'.format(
            id=workflow_id)
        mock_request.patch(update_label_url, json=_request_callback)

        payload = UpdateJobLabelsRequest(
            labels={"test_label": "test_label_value"})
        response = self.client.open(
            '/jobs/{id}/updateLabels'.format(id=workflow_id),
            method='POST',
            data=json.dumps(payload),
            content_type='application/json')
        self.assertStatus(response, 404)
        self.assertEquals(json.loads(response.data)['detail'], error_message)

    @requests_mock.mock()
    def test_update_job_labels_undefined_unsupported_media_type_exception(
            self, mock_request):
        workflow_id = 'id'
        error_message = b'Invalid Content-type (), expected JSON data'

        def _request_callback(request, context):
            context.status_code = 415
            return error_message

        update_label_url = self.base_url + '/{id}/labels'.format(
            id=workflow_id)
        mock_request.patch(update_label_url, json=_request_callback)

        payload = UpdateJobLabelsRequest(labels={"test_label": None})
        response = self.client.open(
            '/jobs/{id}/updateLabels'.format(id=workflow_id),
            headers={'Accept': 'application/json'},
            method='POST',
            data=json.dumps(payload))
        self.assertStatus(response, 415)
        self.assertEquals(json.loads(response.data)['detail'], error_message)

    @requests_mock.mock()
    def test_get_job_returns_200(self, mock_request):
        """
        Test case for get_job

        Query for job and task-level metadata for a specified job
        """
        workflow_id = 'id'
        subworkflow_id = 'subworkflow_id'
        workflow_name = 'test'
        status = 'Succeeded'
        timestamp = '2017-11-08T05:06:41.424Z'
        response_timestamp = '2017-11-08T05:06:41.424000+00:00'
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
                'workflowName': workflow_name,
                'id': workflow_id,
                'status': status,
                'calls': {
                    'test.analysis': [{
                        'jobId': job_id,
                        'executionStatus': 'Done',
                        'shardIndex': -1,
                        'start': timestamp,
                        'end': timestamp,
                        'stderr': std_err,
                        'stdout': std_out,
                        'returnCode': return_code,
                        'inputs': inputs,
                        'attempt': attempts,
                        'subWorkflowId': subworkflow_id
                    }]
                },
                'inputs': inputs,
                'labels': labels,
                'outputs': outputs,
                'submission': timestamp,
                'end': timestamp,
                'start': timestamp,
                'failures': [{
                    'causedBy': [],
                    'message': 'Task test.analysis failed'
                }]
            }  # yapf: disable

        cromwell_url = self.base_url + '/{id}/metadata'.format(id=workflow_id)
        mock_request.get(cromwell_url, json=_request_callback)

        response = self.client.open(
            '/jobs/{id}'.format(id=workflow_id), method='GET')
        self.assertStatus(response, 200)
        response_data = json.loads(response.data)
        expected_data = {
            'name': workflow_name,
            'id': workflow_id,
            'status': status,
            'submission': response_timestamp,
            'start': response_timestamp,
            'end': response_timestamp,
            'inputs': jobs_controller.update_key_names(inputs),
            'outputs': jobs_controller.update_key_names(outputs),
            'labels': labels,
            'extensions':{
                'tasks': [{
                    'name': 'analysis',
                    'executionId': job_id,
                    'executionStatus': 'Succeeded',
                    'start': response_timestamp,
                    'end': response_timestamp,
                    'stderr': std_err,
                    'stdout': std_out,
                    'callCached': False,
                    'inputs': jobs_controller.update_key_names(inputs),
                    'returnCode': return_code,
                    'attempts': attempts,
                    'jobId': subworkflow_id
                }]
            },
            'failures': []
        }  # yapf: disable
        self.assertDictEqual(response_data, expected_data)

    @requests_mock.mock()
    def test_get_scattered_job_returns_200(self, mock_request):
        """
        Test case for get_job

        Query for job and task-level metadata for a specified job
        """
        workflow_id = 'id'
        workflow_name = 'test'
        status = 'Failed'
        timestamp = '2017-11-08T05:06:41.424Z'
        response_timestamp = '2017-11-08T05:06:41.424000+00:00'
        inputs = {'test.inputs': 'gs://project-bucket/test/inputs.txt'}
        outputs = {
            'test.analysis.outputs': 'gs://project-bucket/test/outputs.txt'
        }
        labels = {'cromwell-workflow-id': 'cromwell-12345'}
        job_id1 = 'operations/abcde'
        job_id2 = 'operations/dffdf'
        call_root = '/cromwell/cromwell-executions/id/call-analysis'
        std_err = '/cromwell/cromwell-executions/id/call-analysis/stderr'
        std_out = '/cromwell/cromwell-executions/id/call-analysis/stdout'
        attempts = 1
        return_code = 0

        def _request_callback(request, context):
            context.status_code = 200
            return {
                'workflowName': workflow_name,
                'id': workflow_id,
                'status': status,
                'calls': {
                    'test.analysis': [{
                        'jobId': job_id1,
                        'executionStatus': 'Failed',
                        'shardIndex': 0,
                        'start': timestamp,
                        'end': timestamp,
                        'stderr': std_err,
                        'stdout': std_out,
                        'callRoot': call_root,
                        'returnCode': return_code,
                        'inputs': inputs,
                        'attempt': attempts,
                        'failures': [
                            {
                                'causedBy': [],
                                'message': 'test.analysis shard 0 failed'
                            }
                        ],
                    },{
                        'jobId': job_id2,
                        'executionStatus': 'Failed',
                        'shardIndex': 1,
                        'start': timestamp,
                        'end': timestamp,
                        'stderr': std_err,
                        'stdout': std_out,
                        'callRoot': call_root,
                        'returnCode': return_code,
                        'inputs': inputs,
                        'attempt': attempts,
                        'failures': [
                            {
                                'causedBy': [],
                                'message': 'test.analysis shard 1 failed'
                            }
                        ],
                    }]
                },
                'inputs': inputs,
                'labels': labels,
                'outputs': outputs,
                'submission': timestamp,
                'end': timestamp,
                'start': timestamp,
                'failures': [{
                    'causedBy': [{
                        'causedBy': [],
                        'message': 'test.analysis shard 0 failed'
                    },{
                        'causedBy': [],
                        'message': 'test.analysis shard 1 failed'
                    }],
                    'message': 'Workflow failed'
                }]
            }  # yapf: disable

        cromwell_url = self.base_url + '/{id}/metadata'.format(id=workflow_id)
        mock_request.get(cromwell_url, json=_request_callback)

        response = self.client.open(
            '/jobs/{id}'.format(id=workflow_id), method='GET')
        self.assertStatus(response, 200)
        response_data = json.loads(response.data)
        expected_data = {
            'name': workflow_name,
            'id': workflow_id,
            'status': status,
            'submission': response_timestamp,
            'start': response_timestamp,
            'end': response_timestamp,
            'inputs': jobs_controller.update_key_names(inputs),
            'outputs': jobs_controller.update_key_names(outputs),
            'labels': labels,
            'failures': [{
                'callRoot': call_root,
                'failure': 'test.analysis shard 0 failed',
                'stderr': std_err,
                'stdout': std_out,
                'taskName': 'analysis',
                'timestamp': response_timestamp
            },{
                'callRoot': call_root,
                'failure': 'test.analysis shard 1 failed',
                'stderr': std_err,
                'stdout': std_out,
                'taskName': 'analysis',
                'timestamp': response_timestamp
            }],
            'extensions':{
                'tasks': [{
                    'name': 'analysis',
                    'executionStatus': 'Failed',
                    'start': response_timestamp,
                    'end': response_timestamp,
                    'callRoot': call_root,
                    'callCached': False,
                    'attempts': attempts,
                    'shardStatuses': [{
                        'count': 2,
                        'status': 'Failed'
                    }]
                }]
            }
        }  # yapf: disable
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
            return {'results': [], 'totalResultsCount': 0}

        query_url = self.base_url + '/query'
        mock_request.post(query_url, json=_request_callback)

        query = QueryJobsRequest()
        response = self.client.open(
            '/jobs/query',
            method='POST',
            data=json.dumps(query),
            content_type='application/json')
        self.assertStatus(response, 200)

    def test_empty_cromwell_query_params(self):
        query = QueryJobsRequest()
        self.assertEqual(
            sorted(jobs_controller.cromwell_query_params(query, 1, 64)),
            sorted([{
                'page': '1'
            }, {
                'pageSize': '64'
            }, {
                'additionalQueryResultFields': 'parentWorkflowId'
            }, {
                'additionalQueryResultFields': 'labels'
            }, {
                'includeSubworkflows': 'false'
            }]))

    def test_cromwell_query_params(self):
        datetime_format = '%Y-%m-%dT%H:%M:%S.%fZ'
        query = QueryJobsRequest(
            name='test',
            start=datetime.strptime('2017-10-30T18:04:47.271Z',
                                    datetime_format),
            end=datetime.strptime('2017-10-31T18:04:47.271Z', datetime_format),
            status=['Submitted', 'Running', 'Succeeded'],
            labels={
                'label-key-1': 'label-val-1',
                'label-key-2': 'label-val-2'
            },
            page_size=100)
        query_params = [{
            'name': query.name
        }, {
            'start':
            datetime.strftime(query.start, datetime_format)
        }, {
            'end': datetime.strftime(query.end, datetime_format)
        }, {
            'pageSize': '100'
        }, {
            'page': '23'
        }, {
            'label': 'label-key-1:label-val-1'
        }, {
            'label': 'label-key-2:label-val-2'
        }, {
            'additionalQueryResultFields': 'parentWorkflowId'
        }, {
            'additionalQueryResultFields': 'labels'
        }, {
            'includeSubworkflows': 'false'
        }]
        query_params.extend([{'status': s} for s in query.status])
        self.assertItemsEqual(
            sorted(query_params),
            sorted(jobs_controller.cromwell_query_params(query, 23, 100)))

    def test_format_job(self):
        time = '2017-10-27T18:04:47.271Z'
        job = {
            'id': '12345',
            'name': 'TestJob',
            'status': 'Failed',
            'start': time,
            'end': time
        }
        formatted_time = dateutil.parser.parse(time).astimezone(tzutc())
        result = QueryJobsResult(
            id=job.get('id'),
            name=job.get('name'),
            status=job.get('status'),
            submission=formatted_time,
            start=formatted_time,
            end=formatted_time,
            extensions=ExtendedFields())
        self.assertEqual(
            jobs_controller.format_job(job, formatted_time), result)

    def test_format_job_without_milliseconds(self):
        time = '2017-10-27T18:04:47Z'
        job = {
            'id': '12345',
            'name': 'TestJob',
            'status': 'Failed',
            'start': time,
            'end': time
        }
        formatted_time = dateutil.parser.parse(time).astimezone(tzutc())
        result = QueryJobsResult(
            id=job.get('id'),
            name=job.get('name'),
            status=job.get('status'),
            submission=formatted_time,
            start=formatted_time,
            end=formatted_time,
            extensions=ExtendedFields())
        self.assertEqual(
            jobs_controller.format_job(job, formatted_time), result)

    def test_format_job_with_no_start_date(self):
        time = '2017-10-27T18:04:47Z'
        job = {'id': '12345', 'name': 'TestJob', 'status': 'Failed'}
        formatted_time = dateutil.parser.parse(time).astimezone(tzutc())
        result = QueryJobsResult(
            id=job.get('id'),
            name=job.get('name'),
            status=job.get('status'),
            start=formatted_time,
            submission=formatted_time,
            extensions=ExtendedFields())
        self.assertEqual(
            jobs_controller.format_job(job, formatted_time), result)

    def test_format_job_with_no_end_date(self):
        time = '2017-10-27T18:04:47Z'
        job = {
            'id': '12345',
            'name': 'TestJob',
            'status': 'Failed',
            'start': time
        }
        formatted_time = dateutil.parser.parse(time).astimezone(tzutc())
        result = QueryJobsResult(
            id=job.get('id'),
            name=job.get('name'),
            status=job.get('status'),
            submission=formatted_time,
            start=formatted_time,
            end=None,
            extensions=ExtendedFields())
        self.assertEqual(
            jobs_controller.format_job(job, formatted_time), result)

    def test_page_from_offset(self):
        self.assertEqual(
            jobs_controller.page_from_offset(offset=0, page_size=1), 1)
        self.assertEqual(
            jobs_controller.page_from_offset(offset=1, page_size=1), 2)
        self.assertEqual(
            jobs_controller.page_from_offset(offset=1, page_size=10), 1)
        self.assertEqual(
            jobs_controller.page_from_offset(offset=0, page_size=10), 1)
        self.assertEqual(
            jobs_controller.page_from_offset(offset=10, page_size=10), 2)
        self.assertEqual(
            jobs_controller.page_from_offset(offset=11, page_size=10), 2)
        self.assertEqual(
            jobs_controller.page_from_offset(offset=10, page_size=1), 11)


if __name__ == '__main__':
    import unittest
    unittest.main()
