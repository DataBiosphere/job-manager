from __future__ import absolute_import

import os
import shutil
import tempfile
import time
import unittest
from operator import itemgetter, attrgetter
from . import BaseTestCase
from flask import current_app
from jobs.controllers.job_statuses import ApiStatus
from jobs.models.query_jobs_request import QueryJobsRequest
from six import BytesIO


class TestJobsControllerLocal(BaseTestCase):
    """ JobsController integration tests for local provider """

    def setUp(self):
        self.dsub_local_dir = tempfile.mkdtemp()
        # Set env variable read by dsub to store files for the local provider
        tempfile.tempdir = self.dsub_local_dir
        print self.dsub_local_dir
        # Create logging directory
        self.log_path = '{}/logging'.format(self.dsub_local_dir)
        os.mkdir(self.log_path)

    def tearDown(self):
        # shutil.rmtree(self.dsub_local_dir)
        tempfile.tempdir = None

    def test_abort_job(self):
        job_id = self.start_job('sleep 120')['job-id']
        self.wait_for_job_status(job_id, ApiStatus.RUNNING)
        # TODO(calbach): Change RUNNING semantics so that the above puts us into
        # an abortable state, then remove these retries.
        # Keep retrying until we can abort the job.
        aborted = False
        for i in range(10):
            aborted = self.try_abort_job(job_id)
            if aborted: break
            time.sleep(.5)
        if not aborted:
            self.fail('failed to abort job after multiple retries')
        self.wait_for_job_status(job_id, ApiStatus.ABORTED)

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
        # Get job and validate that the metadata is accurate
        job = self.must_get_job(started['job-id'])
        self.assertEqual(job.id, started['job-id'])
        self.assertEqual(job.labels['user-id'], started['user-id'])
        self.assertEqual(job.inputs, inputs)
        self.assertEqual(job.labels['label'], 'the_label_value')
        self.assertEqual(job.outputs, outputs)
        self.assertEqual(job.logs, self.expected_log_files(started['job-id']))
        self.assertEqual(job.status, ApiStatus.SUCCEEDED)
        # Ensure delocalization worked correctly
        self.assertTrue(os.path.isfile(outputs['OUTPUT_FILE_KEY']))

    def test_get_failed_job(self):
        started = self.start_job('not_a_command')
        job = self.wait_for_job_status(started['job-id'], ApiStatus.FAILED)
        self.assertTrue(len(job.failures[0].failure) > 0)
        self.assertTrue(job.failures[0].timestamp)

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
        self.assert_query_matches(
            QueryJobsRequest(name='NAME_JOB'), [name_job])
        self.assert_query_matches(QueryJobsRequest(name='JOB'), [])

    def test_query_jobs_by_status(self):
        succeeded_job = self.start_job('echo SUCCEEDED', wait=True)
        running_job = self.start_job('echo RUNNING && sleep 30')
        self.wait_for_job_status(running_job['job-id'], ApiStatus.RUNNING)
        self.assert_query_matches(
            QueryJobsRequest(statuses=[ApiStatus.SUCCEEDED]), [succeeded_job])
        self.assert_query_matches(
            QueryJobsRequest(statuses=[ApiStatus.RUNNING]), [running_job])

    def test_query_jobs_by_label(self):
        labels = {
            'label_key': 'the_label_value',
            'matching_key': 'some_value',
            'overlap_key': 'overlap_value'
        }
        other_labels = {
            'diff_label_key': 'other_label_value',
            'matching_key': 'non_matching_value',
            'overlap_key': 'overlap_value'
        }

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

        self.assert_query_matches(QueryJobsRequest(labels=labels), [label_job])
        self.assert_query_matches(
            QueryJobsRequest(labels={'overlap_key': 'overlap_value'}),
            [label_job, other_label_job])

    def assert_query_matches(self, query_params, job_list):
        """Executes query and asserts that the results match the given job_list

        Args:
            query_params (QueryJobsRequest): Request object with the metadata
                to query jobs by
            job_list (list): List of dictionaries of job metadata returned from
                dsub.run(). Specifically contains 'job-id', 'task-id', and
                'user-id' keys
        """
        response = self.must_query_jobs(query_params)
        self.assertEqual(len(response.results), len(job_list))
        sorted_results = sorted(response.results, key=attrgetter('id'))
        sorted_job_list = sorted(job_list, key=itemgetter('job-id'))
        for result, job in zip(sorted_results, sorted_job_list):
            self.assertEqual(result.id, job['job-id'])
            self.assertEqual(result.labels['user-id'], job['user-id'])

    # TODO(https://github.com/bvprivate/job-monitor/issues/73) Add tests for
    # querying by start and end times once implemented by dsub shim


if __name__ == '__main__':
    unittest.main()
