import connexion
import datetime
from dsub.commands import dsub
from dsub.lib import job_util, param_util
import flask
import flask_testing
import logging
import operator
import os
import string
import time

from jobs.common import execute_redirect_stdout
from jobs.controllers.utils.job_statuses import ApiStatus
from jobs.encoder import JSONEncoder
from jobs.models.job_metadata_response import JobMetadataResponse
from jobs.models.query_jobs_response import QueryJobsResponse
from jobs.models.query_jobs_request import QueryJobsRequest

DOCKER_IMAGE = 'ubuntu:14.04'


class BaseTestCases:
    class BaseTestCase(flask_testing.TestCase):
        def assert_status(self, response, want, desc=None):
            if not desc:
                desc = 'Response body is : ' + response.data.decode('utf-8')
            super(BaseTestCases.BaseTestCase, self).assertStatus(
                response, want, desc)

    class JobsControllerTestCase(BaseTestCase):
        @classmethod
        def setUpClass(cls):
            cls.testing_root = None
            cls.testing_project = None
            cls.provider = None
            cls.wait_timeout = 30

        def assert_query_matches(self, query_params, job_list):
            """Executes query and asserts that the results match the given job_list

            Args:
                query_params (QueryJobsRequest): Request object with the metadata
                    to query jobs by
                job_list (list): List of dictionaries of job metadata returned from
                    dsub.run(). Specifically contains 'job-id', 'task-id', and
                    'user-id' keys
            """
            if self.testing_project:
                query_params.parent_id = self.testing_project
            response = self.must_query_jobs(query_params)
            self.assertEqual(len(response.results), len(job_list))
            sorted_results = sorted(
                response.results, key=operator.attrgetter('id'))
            sorted_job_list = sorted(job_list, key=self.get_api_job_id)
            for result, job in zip(sorted_results, sorted_job_list):
                self.assertEqual(result.id, self.get_api_job_id(job))
                self.assertEqual(result.labels['user-id'], job['user-id'])

        def create_app(self):
            logging.getLogger('connexion.operation').setLevel('ERROR')
            app = connexion.App(__name__, specification_dir='../swagger/')
            app.app.json_encoder = JSONEncoder
            app.add_api('swagger.yaml')
            return app.app

        def expected_log_files(self, job_id):
            return {
                'controller-log': '{}/{}.log'.format(self.log_path, job_id),
                'stderr': '{}/{}-stderr.log'.format(self.log_path, job_id),
                'stdout': '{}/{}-stdout.log'.format(self.log_path, job_id),
            }

        def get_api_job_id(self, dsub_job):
            if self.testing_project:
                return '{}:{}'.format(self.testing_project, dsub_job['job-id'])
            else:
                return dsub_job['job-id']

        def job_has_status(self, job, status):
            return job.status == status

        def must_get_job(self, job_id):
            resp = self.client.open('/jobs/{}'.format(job_id), method='GET')
            self.assert_status(resp, 200)
            return JobMetadataResponse.from_dict(resp.json)

        def must_query_jobs(self, parameters):
            resp = self.client.open(
                '/jobs/query',
                method='POST',
                data=flask.json.dumps(parameters),
                content_type='application/json')
            self.assert_status(resp, 200)
            return QueryJobsResponse.from_dict(resp.json)

        def start_job(self,
                      command,
                      name=None,
                      envs={},
                      labels={},
                      inputs={},
                      inputs_recursive={},
                      outputs={},
                      outputs_recursive={},
                      wait=False):
            logging = param_util.build_logging_param(self.log_path)
            resources = job_util.JobResources(
                image=DOCKER_IMAGE, logging=logging, zones=['us-central1*'])

            env_data = {param_util.EnvParam(k, v) for (k, v) in envs.items()}
            label_data = {
                param_util.LabelParam(k, v)
                for (k, v) in labels.items()
            }

            # This is mostly an extraction dsubs argument parsing here:
            # https://github.com/googlegenomics/dsub/blob/master/dsub/lib/param_util.py#L720
            # Reworked it to handle dictionaries rather than a list of items
            # of the form 'key=val'
            input_file_param_util = param_util.InputFileParamUtil('input')
            input_data = set()
            for (recursive, items) in ((False, inputs.items()),
                                       (True, inputs_recursive.items())):
                for (name, value) in items:
                    name = input_file_param_util.get_variable_name(name)
                    input_data.add(
                        input_file_param_util.make_param(
                            name, value, recursive))

            output_file_param_util = param_util.OutputFileParamUtil('output')
            output_data = set()
            for (recursive, items) in ((False, outputs.items()),
                                       (True, outputs_recursive.items())):
                for (name, value) in items:
                    name = output_file_param_util.get_variable_name(name)
                    output_data.add(
                        output_file_param_util.make_param(
                            name, value, recursive))

            job_data = {
                'envs': env_data,
                'inputs': input_data,
                'outputs': output_data,
                'labels': label_data,
            }
            all_task_data = [{
                'envs': env_data,
                'labels': label_data,
                'inputs': input_data,
                'outputs': output_data,
            }]

            return execute_redirect_stdout(lambda:
                dsub.run(
                    self.provider,
                    resources,
                    job_data,
                    all_task_data,
                    name=name,
                    command=command,
                    wait=wait,
                    disable_warning=True))

        def must_abort_job(self, job_id):
            resp = self.client.open(
                '/jobs/{}/abort'.format(job_id), method='POST')
            self.assert_status(resp, 200)

        def wait_for_job_status(self, job_id, status, poll_interval=5):
            has_status = False
            job = None
            remaining = self.wait_timeout
            while remaining is None or remaining > 0:
                job = self.must_get_job(job_id)
                has_status = self.job_has_status(job, status)
                if has_status: break
                time.sleep(poll_interval)
                if remaining is not None:
                    remaining -= poll_interval

            if remaining <= 0:
                raise Exception(
                    'Wait for job \'{}\' to be \'{}\' timed out after {} seconds'
                    .format(job_id, status, self.wait_timeout))

            return job

        def test_abort_job(self):
            started = self.start_job('sleep 30')
            api_job_id = self.get_api_job_id(started)
            self.wait_for_job_status(api_job_id, ApiStatus.RUNNING)
            self.must_abort_job(api_job_id)
            self.wait_for_job_status(api_job_id, ApiStatus.ABORTED)

        def test_update_job_labels(self):
            resp = self.client.open('/jobs/asdf/updateLabels', method='POST')
            self.assert_status(resp, 501)

        def test_abort_terminal_job_fails(self):
            started = self.start_job('echo FOO', wait=True)
            api_job_id = self.get_api_job_id(started)
            self.wait_for_job_status(api_job_id, ApiStatus.SUCCEEDED)
            resp = self.client.open(
                '/jobs/{}/abort'.format(api_job_id), method='POST')
            self.assert_status(resp, 412)

        def test_abort_non_existent_job_fails(self):
            resp = self.client.open(
                '/jobs/{}/abort'.format(
                    self.get_api_job_id({
                        'job-id': 'not-a-job'
                    })),
                method='POST')
            self.assert_status(resp, 404)

        def test_get_succeeded_job(self):
            inputs = {
                'INPUT_KEY': '{}/inputs/test-input'.format(self.testing_root)
            }
            outputs = {
                'OUTPUT_KEY': '{}/outputs/test-output'.format(
                    self.testing_root)
            }
            started = self.start_job(
                'echo -n >${OUTPUT_KEY}',
                labels={'label': 'the_label_value'},
                inputs=inputs,
                outputs=outputs)
            api_job_id = self.get_api_job_id(started)
            self.wait_for_job_status(api_job_id, ApiStatus.SUCCEEDED)
            # Get job and validate that the metadata is accurate
            job = self.must_get_job(api_job_id)
            self.assertEqual(job.id, api_job_id)
            self.assertEqual(job.labels['user-id'], started['user-id'])
            self.assertEqual(job.inputs, inputs)
            self.assertEqual(job.labels['label'], 'the_label_value')
            self.assertEqual(job.outputs, outputs)
            self.assertEqual(job.status, ApiStatus.SUCCEEDED)

        def test_get_failed_job(self):
            started = self.start_job('not_a_command')
            api_job_id = self.get_api_job_id(started)
            job = self.wait_for_job_status(api_job_id, ApiStatus.FAILED)
            self.assertTrue(len(job.failures[0].failure) > 0)
            self.assertTrue(job.failures[0].timestamp)

        def test_get_non_existent_job_fails(self):
            resp = self.client.open(
                '/jobs/{}'.format(
                    self.get_api_job_id({
                        'job-id': 'not-a-job'
                    })),
                method='GET')
            self.assert_status(resp, 404)

        # TODO(bryancrampton) Add tests around dsub job's with multiple tasks and
        # using joined {job-id}:{task-id} (and project-id once there are tests for
        # the google provider tests)

        def test_query_jobs_by_name(self):
            name_job = self.start_job('echo NAME', name='named-job')
            other_name_job = self.start_job('echo OTHER', name='other-job')
            no_name_job = self.start_job('echo UNSPECIFIED')
            self.assert_query_matches(
                QueryJobsRequest(name='named-job'), [name_job])
            self.assert_query_matches(QueryJobsRequest(name='job'), [])

        def test_query_jobs_by_status(self):
            succeeded_job = self.start_job('echo SUCCEEDED', wait=True)
            running_job = self.start_job('echo RUNNING && sleep 30')
            running_job_id = self.get_api_job_id(running_job)
            self.wait_for_job_status(running_job_id, ApiStatus.RUNNING)
            self.assert_query_matches(
                QueryJobsRequest(statuses=[ApiStatus.SUCCEEDED]),
                [succeeded_job])
            self.assert_query_matches(
                QueryJobsRequest(statuses=[ApiStatus.RUNNING]), [running_job])
            self.assert_query_matches(
                QueryJobsRequest(
                    statuses=[ApiStatus.RUNNING, ApiStatus.SUCCEEDED]),
                [succeeded_job, running_job])
            self.assert_query_matches(
                QueryJobsRequest(
                    statuses=[ApiStatus.SUCCEEDED, ApiStatus.RUNNING]),
                [succeeded_job, running_job])

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
            label_job_id = self.get_api_job_id(label_job)
            other_label_job = self.start_job(
                'echo OTHER', labels=other_labels, name='otherlabeljob')
            other_label_job_id = self.get_api_job_id(other_label_job)
            no_label_job = self.start_job('echo NO_LABEL', name='nolabeljob')
            no_label_job_id = self.get_api_job_id(no_label_job)

            self.assert_query_matches(
                QueryJobsRequest(labels=labels), [label_job])
            self.assert_query_matches(
                QueryJobsRequest(labels={
                    'overlap_key': 'overlap_value'
                }), [label_job, other_label_job])

        def test_query_jobs_by_start(self):
            first_time = datetime.datetime.now()
            first_job = self.start_job('echo FIRST_JOB', name='job1')
            time.sleep(1)
            second_time = datetime.datetime.now()
            second_job = self.start_job('echo SECOND_JOB', name='job2')
            time.sleep(1)
            third_time = datetime.datetime.now()
            third_job = self.start_job('echo THIRD_JOB', name='job3')
            time.sleep(1)
            fourth_time = datetime.datetime.now()
            fourth_job = self.start_job('echo FOURTH_JOB', name='job4')

            self.assert_query_matches(
                QueryJobsRequest(start=first_time),
                [first_job, second_job, third_job, fourth_job])
            self.assert_query_matches(
                QueryJobsRequest(start=second_time),
                [second_job, third_job, fourth_job])
            self.assert_query_matches(
                QueryJobsRequest(start=third_time), [third_job, fourth_job])
            self.assert_query_matches(
                QueryJobsRequest(start=fourth_time), [fourth_job])
