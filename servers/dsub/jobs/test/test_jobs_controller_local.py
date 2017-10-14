from __future__ import absolute_import

import os
import shutil
import tempfile
import time
import unittest
from . import BaseTestCase
from flask import current_app
from jobs.controllers.job_statuses import ApiStatus
from jobs.models.job_metadata_response import JobMetadataResponse
from jobs.models.query_jobs_request import QueryJobsRequest
from six import BytesIO


class TestJobsControllerLocal(BaseTestCase):
    """ JobsController integration tests for local provider """

    def setUp(self):
        self.dsub_local_dir = tempfile.mkdtemp()
        # Set env variable read by dsub to store files for the local provider
        tempfile.tempdir = self.dsub_local_dir
        # Create logging directory
        self.log_path = '{}/logging'.format(self.dsub_local_dir)
        os.mkdir(self.log_path)

    def tearDown(self):
        shutil.rmtree(self.dsub_local_dir)
        tempfile.tempdir = None

    def test_abort_job(self):
        started = self.start_job('sleep 120')
        self.wait_for_job_status(started['job-id'], ApiStatus.RUNNING)
        self.must_abort_job(started['job-id'])
        self.wait_for_job_status(started['job-id'], ApiStatus.ABORTED)

    def test_abort_terminal_job_fails(self):
        job = self.start_job('echo FOO', wait=True)
        self.wait_for_job_status(job['job-id'], ApiStatus.SUCCEEDED)
        resp = self.client.open(
            '/jobs/{}/abort'.format(job['job-id']), method='POST')
        self.assertStatus(resp, 412)

    def test_abort_non_existent_job_fails(self):
        resp = self.client.open('/jobs/not-a-job/abort', method='POST')
        self.assertStatus(resp, 404)

    def test_get_succeeded_job(self):
        # Create inputs directory and add files
        inputs = {
            'SOME_INPUT_FILE': self.create_input_file(self.dsub_local_dir)
        }
        outputs = {
            'SOME_OUTPUT_FILE':
            '{}/output/{}'.format(self.dsub_local_dir, self.random_word(10))
        }
        label_value = self.random_word(10)
        started = self.start_job(
            'echo -n >${SOME_OUTPUT_FILE}',
            labels={'label': label_value},
            inputs=inputs,
            outputs=outputs,
            wait=True)
        # Build expected outputs with logging paths
        outputs.update(self.expected_log_files(started['job-id']))
        # Get job and validate that the metadata is accurate
        job = self.must_get_job(started['job-id'])
        self.assertEqual(job.id, started['job-id'])
        self.assertEqual(job.labels['user-id'], started['user-id'])
        self.assertEqual(job.inputs, inputs)
        self.assertEqual(job.labels['label'], label_value)
        self.assertEqual(job.outputs, outputs)
        self.assertEqual(job.status, ApiStatus.SUCCEEDED)
        # Ensure delocalization worked correctly
        self.assertTrue(os.path.isfile(outputs['SOME_OUTPUT_FILE']))

    def test_get_failed_job(self):
        started = self.start_job('not_a_command')
        self.wait_for_job_status(started['job-id'], ApiStatus.FAILED)

    def test_get_non_existent_job_fails(self):
        resp = self.client.open('/jobs/not-a-job', method='GET')
        self.assertStatus(resp, 404)

    # TODO(bryancrampton) Add tests around dsub job's with multiple tasks and
    # using joined {job-id}:{task-id} (and project-id once there are tests for
    # the google provider tests)

    def test_query_jobs_by_name(self):
        job = self.start_job('echo FOO', name='TEST_JOB', wait=True)
        parameters = QueryJobsRequest(name='TEST_JOB')
        response = self.must_query_jobs(parameters)
        self.assertEqual(len(response.results), 1)
        result = response.results[0]
        self.assertEqual(result.id, job['job-id'])
        self.assertEqual(result.labels['user-id'], job['user-id'])
        self.assertEqual(result.status, ApiStatus.SUCCEEDED)

    def test_query_jobs_by_status(self):
        job = self.start_job('echo FOO', wait=True)
        parameters = QueryJobsRequest(statuses=[ApiStatus.SUCCEEDED])
        response = self.must_query_jobs(parameters)
        self.assertEqual(len(response.results), 1)
        result = response.results[0]
        self.assertEqual(result.id, job['job-id'])
        self.assertEqual(result.labels['user-id'], job['user-id'])

    # TODO(https://github.com/bvprivate/job-monitor/issues/73) Add tests for
    # querying by start and end times once implemented by dsub shim

    # TODO(https://github.com/bvprivate/job-monitor/issues/69) Add tests for
    # querying by labels once supported in the API


if __name__ == '__main__':
    unittest.main()
