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
        inputs = {
            'INPUT_FILE_KEY':
            self.create_input_file(self.dsub_local_dir, 'THE_INPUT_FILE')
        }
        outputs = {
            'OUTPUT_FILE_KEY':
            '{}/output/{}'.format(self.dsub_local_dir, 'THE_OUTPUT_FILE')
        }
        started = self.start_job(
            'echo -n >${OUTPUT_FILE_KEY}',
            labels={'label': 'the_label_value'},
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
        self.assertEqual(job.labels['label'], 'the_label_value')
        self.assertEqual(job.outputs, outputs)
        self.assertEqual(job.status, ApiStatus.SUCCEEDED)
        # Ensure delocalization worked correctly
        self.assertTrue(os.path.isfile(outputs['OUTPUT_FILE_KEY']))

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
        name_job = self.start_job('echo NAME', name='NAME_JOB')
        other_name_job = self.start_job('echo OTHER', name='OTHER_JOB')
        no_name_job = self.start_job('echo NO_NAME')
        parameters = QueryJobsRequest(name='NAME_JOB')
        response = self.must_query_jobs(parameters)
        self.assertEqual(len(response.results), 1)
        result = response.results[0]
        self.assertEqual(result.id, name_job['job-id'])
        self.assertEqual(result.labels['user-id'], name_job['user-id'])

    def test_query_jobs_by_status(self):
        suc_job = self.start_job('echo SUCCEEDED', wait=True)
        run_job = self.start_job('echo RUNNING && sleep 30')
        self.wait_for_job_status(run_job['job-id'], ApiStatus.RUNNING)
        suc_params = QueryJobsRequest(statuses=[ApiStatus.SUCCEEDED])
        run_params = QueryJobsRequest(statuses=[ApiStatus.RUNNING])
        suc_response = self.must_query_jobs(suc_params)
        run_response = self.must_query_jobs(run_params)
        self.assertEqual(len(suc_response.results), 1)
        self.assertEqual(len(run_response.results), 1)
        suc_result = suc_response.results[0]
        run_result = run_response.results[0]
        self.assertEqual(suc_result.id, suc_job['job-id'])
        self.assertEqual(suc_result.labels['user-id'], suc_job['user-id'])
        self.assertEqual(run_result.id, run_job['job-id'])
        self.assertEqual(run_result.labels['user-id'], run_job['user-id'])

    def test_query_jobs_by_label(self):
        labels = {'label_key': 'the_label_value'}
        other_labels = {'diff_label_key': 'other_label_value'}
        label_job = self.start_job(
            'echo LABEL', labels=labels, name='labeljob')
        other_label_job = self.start_job(
            'echo OTHER', labels=other_labels, name='otherlabeljob')
        no_label_job = self.start_job('echo NO_LABEL', name='nolabeljob')

        # TODO(https://github.com/googlegenomics/dsub/issues/82) remove waiting
        # for running which shouldn't be needed
        self.wait_for_job_status(label_job['job-id'], ApiStatus.RUNNING)
        self.wait_for_job_status(other_label_job['job-id'], ApiStatus.RUNNING)
        self.wait_for_job_status(no_label_job['job-id'], ApiStatus.RUNNING)

        parameters = QueryJobsRequest(labels=labels)
        response = self.must_query_jobs(parameters)
        self.assertEqual(len(response.results), 1)
        result = response.results[0]
        self.assertEqual(result.id, label_job['job-id'])
        self.assertEqual(result.labels['user-id'], label_job['user-id'])

    # TODO(https://github.com/bvprivate/job-monitor/issues/73) Add tests for
    # querying by start and end times once implemented by dsub shim


if __name__ == '__main__':
    unittest.main()
