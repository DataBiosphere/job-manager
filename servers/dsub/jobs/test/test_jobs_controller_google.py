from __future__ import absolute_import

import datetime
from dsub.providers import google
import flask
import operator
import unittest

from jobs.test.base_test_cases import BaseTestCases
from jobs.controllers.utils.job_statuses import ApiStatus
from jobs.models.extended_query_fields import ExtendedQueryFields
from jobs.models.query_jobs_request import QueryJobsRequest


class TestJobsControllerGoogle(BaseTestCases.JobsControllerTestCase):
    """ JobsController integration tests for local provider """

    @classmethod
    def setUpClass(cls):
        super(TestJobsControllerGoogle, cls).setUpClass()
        cls.testing_root = 'gs://bvdp-jmui-testing/google'
        cls.testing_project = 'bvdp-jmui-testing'
        cls.provider = google.GoogleJobProvider(False, False,
                                                cls.testing_project)
        cls.wait_timeout = 360
        cls.poll_interval = 5

    def setUp(self):
        self.log_path = '{}/logging'.format(self.testing_root)
        # Because all these tests are being run in the same project, add a
        # unique test_token to scope all jobs to this test
        self.test_token_label = {
            'test_token': datetime.datetime.now().strftime('%Y%m%d_%H%M%S_%f')
        }

    def create_app(self):
        app = super(TestJobsControllerGoogle, self).create_app()
        app.config.update({
            'PROVIDER_TYPE': 'google',
            'REQUIRES_AUTH': False,
        })
        return app

    def assert_query_matches(self, query_params, job_list):
        if query_params.extensions:
            query_params.extensions.project_id = self.testing_project
        else:
            query_params.extensions = ExtendedQueryFields(
                project_id=self.testing_project)
        if query_params.labels:
            query_params.labels.update(self.test_token_label)
        else:
            query_params.labels = self.test_token_label
        return super(TestJobsControllerGoogle, self).assert_query_matches(
            query_params, job_list)

    def start_job(self,
                  command,
                  name=None,
                  envs={},
                  labels={},
                  inputs={},
                  inputs_recursive={},
                  outputs={},
                  outputs_recursive={},
                  task_count=1,
                  wait=False):
        labels.update(self.test_token_label)
        return super(TestJobsControllerGoogle, self).start_job(
            command,
            name=name,
            envs=envs,
            labels=labels,
            inputs=inputs,
            inputs_recursive=inputs_recursive,
            outputs=outputs,
            outputs_recursive=outputs_recursive,
            task_count=task_count,
            wait=wait)

    def test_abort_job(self):
        started = self.start_job('sleep 30')
        api_job_id = self.api_job_id(started)
        self.wait_status(api_job_id, ApiStatus.RUNNING)
        self.must_abort_job(api_job_id)
        self.wait_status(api_job_id, ApiStatus.ABORTED)

    def test_query_jobs_invalid_project(self):
        params = QueryJobsRequest(
            extensions=ExtendedQueryFields(project_id='some-bogus-project-id'))
        resp = self.client.open(
            '/jobs/query',
            method='POST',
            data=flask.json.dumps(params),
            content_type='application/json')
        self.assert_status(resp, 404)
        self.assertEqual(resp.json['detail'],
                         'Project \"some-bogus-project-id\" not found')

    def test_query_jobs_by_submitted_status(self):
        job1 = self.start_job('echo job1 && sleep 30', name='job1')
        self.assert_query_matches(
            QueryJobsRequest(statuses=[ApiStatus.SUBMITTED]), [job1])
        self.wait_status(self.api_job_id(job1), ApiStatus.RUNNING)
        job2 = self.start_job('echo job2 && sleep 30', name='job2')
        self.assert_query_matches(
            QueryJobsRequest(statuses=[ApiStatus.SUBMITTED]), [job2])
        self.assert_query_matches(
            QueryJobsRequest(statuses=[ApiStatus.RUNNING]), [job1])

    def test_query_jobs_by_start(self):
        date = datetime.datetime.now()
        job = self.start_job('sleep 30', name='job_by_start')
        self.assert_query_matches(QueryJobsRequest(start=date), [])
        self.wait_status(self.api_job_id(job), ApiStatus.RUNNING)
        self.assert_query_matches(QueryJobsRequest(start=date), [job])

    def test_aggregtion_jobs_invalid_project_id(self):
        time_frame = 'DAYS_7'
        project_id = 'should-be-an-invalid-id'
        resp = self.client.open(
            '/aggregations?projectId={}&timeFrame={}'.format(
                project_id, time_frame),
            method='GET')
        self.assert_status(resp, 500)


if __name__ == '__main__':
    unittest.main()
