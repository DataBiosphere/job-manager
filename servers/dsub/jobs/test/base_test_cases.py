import connexion
import datetime
from dsub.commands import dsub
from dsub.lib import job_model, param_util
from dsub.providers import local
from dsub.lib import resources
import flask
import flask_testing
from flask import current_app
import logging
import operator
import os
import string
import time

from jobs.common import execute_redirect_stdout
from jobs.controllers.utils import job_ids, providers
from jobs.controllers.utils.job_statuses import ApiStatus
from jobs.encoder import JSONEncoder
from jobs.controllers.utils.providers import ProviderType
from jobs.models.extended_query_fields import ExtendedQueryFields
from jobs.models.job_metadata_response import JobMetadataResponse
from jobs.models.query_jobs_response import QueryJobsResponse
from jobs.models.query_jobs_request import QueryJobsRequest
from jobs.models.aggregation_response import AggregationResponse
from jobs.models.status_counts import StatusCounts

DOCKER_IMAGE = 'ubuntu:14.04'


class BaseTestCases:
    class BaseTestCase(flask_testing.TestCase):
        def assert_status(self, response, want, desc=None):
            if not desc:
                desc = 'Response body is : ' + response.data.decode('utf-8')
            super(BaseTestCases.BaseTestCase,
                  self).assertStatus(response, want, desc)

    class JobsControllerTestCase(BaseTestCase):
        @classmethod
        def setUpClass(cls):
            cls.testing_root = None
            cls.testing_project = None
            cls.provider = None
            cls.wait_timeout = 30
            cls.poll_interval = 1

        def setUp(self):
            self.test_token_label = {
                'test_token':
                datetime.datetime.now().strftime('%Y%m%d_%H%M%S_%f')
            }

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
            sorted_results = sorted(response.results,
                                    key=operator.attrgetter('id'))
            sorted_job_list = sorted(job_list, key=self.api_job_id)
            for result, job in zip(sorted_results, sorted_job_list):
                self.assertEqual(result.id, self.api_job_id(job))
                self.assertEqual(result.extensions.user_id, job['user-id'])
            return response

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

        def api_job_id(self, dsub_job):
            return job_ids.dsub_to_api(self.testing_project,
                                       dsub_job['job-id'],
                                       dsub_job.get('task-id', ''),
                                       dsub_job.get('task-attempt', ''))

        def job_has_status(self, job, status):
            return job.status == status

        def must_get_job(self, job_id):
            resp = self.client.open('/jobs/{}'.format(job_id), method='GET')
            self.assert_status(resp, 200)
            return JobMetadataResponse.from_dict(resp.json)

        def must_query_jobs(self, parameters):
            if self.testing_project:
                if parameters.extensions:
                    parameters.extensions.project_id = self.testing_project
                else:
                    parameters.extensions = ExtendedQueryFields(
                        project_id=self.testing_project)
            resp = self.client.open('/jobs/query',
                                    method='POST',
                                    data=flask.json.dumps(parameters),
                                    content_type='application/json')
            self.assert_status(resp, 200)
            return QueryJobsResponse.from_dict(resp.json)

        def must_get_job_aggregations(self, time_frame):
            if self.testing_project:
                url = '/aggregations?projectId={}&timeFrame={}'.format(
                    self.testing_project, time_frame)
            else:
                url = '/aggregations?timeFrame={}'.format(time_frame)

            resp = self.client.open(url, method='GET')
            self.assert_status(resp, 200)
            return AggregationResponse.from_dict(resp.json)

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

            logging = param_util.build_logging_param(self.log_path)
            resources = job_model.Resources(image=DOCKER_IMAGE,
                                            logging=logging,
                                            zones=['us-central1*'])

            env_data = {param_util.EnvParam(k, v) for (k, v) in envs.items()}
            label_data = {
                job_model.LabelParam(k, v)
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

            job_params = {
                'envs': env_data,
                'inputs': input_data,
                'outputs': output_data,
                'labels': label_data,
            }

            if task_count > 1:
                task_descriptors = [
                    job_model.TaskDescriptor({'task-id': i + 1}, {
                        'envs': env_data,
                        'inputs': input_data,
                        'outputs': output_data,
                        'labels': label_data,
                    }, job_model.Resources()) for i in xrange(task_count)
                ]
                all_task_data = [{
                    'task-id': i + 1
                } for i in xrange(task_count)]
            else:
                task_descriptors = [
                    job_model.TaskDescriptor({'task-id': None}, {
                        'labels': set(),
                        'envs': set(),
                        'inputs': set(),
                        'outputs': set()
                    }, job_model.Resources())
                ]

            return execute_redirect_stdout(
                lambda: dsub.run(self.provider,
                                 resources,
                                 job_params,
                                 task_descriptors,
                                 name=name,
                                 command=command,
                                 wait=wait,
                                 disable_warning=True))

        def must_abort_job(self, job_id):
            resp = self.client.open('/jobs/{}/abort'.format(job_id),
                                    method='POST')
            self.assert_status(resp, 200)

        def wait_status(self, job_id, status):
            has_status = False
            job = None
            remaining = self.wait_timeout
            while remaining is None or remaining > 0:
                job = self.must_get_job(job_id)
                has_status = self.job_has_status(job, status)
                if has_status: break
                time.sleep(self.poll_interval)
                if remaining is not None:
                    remaining -= self.poll_interval

            if remaining <= 0:
                raise Exception(
                    'Wait for job \'{}\' to be \'{}\' timed out after {} seconds'
                    .format(job_id, status, self.wait_timeout))

            return job

        def test_update_job_labels(self):
            resp = self.client.open('/jobs/asdf/updateLabels', method='POST')
            self.assert_status(resp, 500)

        def test_abort_terminal_job_fails(self):
            started = self.start_job('echo FOO', wait=True)
            api_job_id = self.api_job_id(started)
            self.wait_status(api_job_id, ApiStatus.SUCCEEDED)
            resp = self.client.open('/jobs/{}/abort'.format(api_job_id),
                                    method='POST')
            self.assert_status(resp, 412)

        def test_abort_non_existent_job_fails(self):
            resp = self.client.open('/jobs/{}/abort'.format(
                self.api_job_id({'job-id': 'not-a-job'})),
                                    method='POST')
            self.assert_status(resp, 404)

        def test_get_succeeded_job(self):
            inputs = {
                'INPUT_KEY': '{}/inputs/test-input'.format(self.testing_root)
            }
            outputs = {
                'OUTPUT_KEY':
                '{}/outputs/test-output'.format(self.testing_root)
            }
            started = self.start_job('echo -n >${OUTPUT_KEY}',
                                     labels={'label': 'the_label_value'},
                                     inputs=inputs,
                                     outputs=outputs)
            api_job_id = self.api_job_id(started)
            self.wait_status(api_job_id, ApiStatus.SUCCEEDED)

            # Get job and validate that the metadata is accurate
            job = self.must_get_job(api_job_id)
            self.assertEqual(job.id, api_job_id)
            self.assertEqual(job.extensions.user_id, started['user-id'])
            self.assertEqual(job.inputs, inputs)
            self.assertEqual(job.labels['label'], 'the_label_value')
            self.assertEqual(job.outputs, outputs)
            self.assertEqual(job.status, ApiStatus.SUCCEEDED)

        def test_get_failed_job(self):
            started = self.start_job('not_a_command')
            api_job_id = self.api_job_id(started)
            job = self.wait_status(api_job_id, ApiStatus.FAILED)
            self.assertTrue(len(job.failures[0].failure) > 0)
            self.assertTrue(job.failures[0].timestamp)

        def test_get_non_existent_job_fails(self):
            resp = self.client.open('/jobs/{}'.format(
                self.api_job_id({'job-id': 'not-a-job'})),
                                    method='GET')
            self.assert_status(resp, 404)

        # TODO(bryancrampton) Add tests around dsub job's with multiple tasks and
        # using joined {job-id}:{task-id} (and project-id once there are tests for
        # the google provider tests)

        def test_query_jobs_by_name(self):
            name_job = self.start_job('echo NAME', name='named-job')
            other_name_job = self.start_job('echo OTHER', name='other-job')
            no_name_job = self.start_job('echo UNSPECIFIED')
            self.assert_query_matches(QueryJobsRequest(name='named-job'),
                                      [name_job])
            self.assert_query_matches(QueryJobsRequest(name='job'), [])

        def test_query_jobs_by_status(self):
            succeeded = self.start_job('echo SUCCEEDED', name='succeeded')
            self.wait_status(self.api_job_id(succeeded), ApiStatus.SUCCEEDED)
            running = self.start_job('echo RUNNING && sleep 30',
                                     name='running')
            self.wait_status(self.api_job_id(running), ApiStatus.RUNNING)
            self.assert_query_matches(
                QueryJobsRequest(status=[ApiStatus.SUCCEEDED]), [succeeded])
            self.assert_query_matches(
                QueryJobsRequest(status=[ApiStatus.RUNNING]), [running])
            self.assert_query_matches(
                QueryJobsRequest(
                    status=[ApiStatus.RUNNING, ApiStatus.SUCCEEDED]),
                [succeeded, running])
            self.assert_query_matches(
                QueryJobsRequest(
                    status=[ApiStatus.SUCCEEDED, ApiStatus.RUNNING]),
                [succeeded, running])

        def test_query_jobs_by_label_job_id(self):
            job = self.start_job('echo BY_JOB_ID', name='by_job_id')
            self.assert_query_matches(
                QueryJobsRequest(labels={'job-id': job['job-id']}), [job])

        def test_query_jobs_by_label_task_id(self):
            started = self.start_job('echo BY_TASK_ID',
                                     name='by_task_id',
                                     task_count=2)
            jobs = self.must_query_jobs(
                QueryJobsRequest(labels={'job-id': started['job-id']}))
            for task_id in started['task-id']:
                task = started.copy()
                task['task-id'] = task_id
                self.assert_query_matches(
                    QueryJobsRequest(labels={'task-id': task_id}), [task])

        def test_query_jobs_by_label_user_id(self):
            job = self.start_job('echo BY_USER_ID', name='by_user_id')
            self.assert_query_matches(
                QueryJobsRequest(extensions=ExtendedQueryFields(
                    user_id=job['user-id'])), [job])

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

            label_job = self.start_job('echo LABEL',
                                       labels=labels,
                                       name='labeljob')
            label_job_id = self.api_job_id(label_job)
            other_label_job = self.start_job('echo OTHER',
                                             labels=other_labels,
                                             name='otherlabeljob')
            other_label_job_id = self.api_job_id(other_label_job)
            no_label_job = self.start_job('echo NO_LABEL', name='nolabeljob')
            no_label_job_id = self.api_job_id(no_label_job)

            self.assert_query_matches(QueryJobsRequest(labels=labels),
                                      [label_job])
            self.assert_query_matches(
                QueryJobsRequest(labels={'overlap_key': 'overlap_value'}),
                [label_job, other_label_job])

        def test_query_jobs_by_submission_end(self):
            first_time = datetime.datetime.now()
            first_job = self.start_job('echo ONE', name='job1', wait=True)
            second_time = datetime.datetime.now()
            second_job = self.start_job('echo TWO', name='job2', wait=True)
            third_time = datetime.datetime.now()
            third_job = self.start_job('echo THREE', name='job3', wait=True)
            fourth_time = datetime.datetime.now()

            self.assert_query_matches(QueryJobsRequest(submission=first_time),
                                      [first_job, second_job, third_job])
            self.assert_query_matches(QueryJobsRequest(submission=second_time),
                                      [second_job, third_job])
            self.assert_query_matches(QueryJobsRequest(submission=third_time),
                                      [third_job])
            self.assert_query_matches(QueryJobsRequest(end=second_time),
                                      [first_job])
            self.assert_query_matches(QueryJobsRequest(end=third_time),
                                      [first_job, second_job])
            self.assert_query_matches(QueryJobsRequest(end=fourth_time),
                                      [first_job, second_job, third_job])
            self.assert_query_matches(
                QueryJobsRequest(end=fourth_time, submission=second_time),
                [second_job, third_job])

        def test_query_jobs_pagination(self):
            # Jobs are sorted first by create-time then by job-id. We cannot
            # guarantee these start at the exact same second, but we know some
            # of them will. Thus, lets make the job name sort in the same order
            # as create-time so the order is deterministic.
            job1 = self.start_job('echo FIRST_JOB', name='job_z')
            job2 = self.start_job('echo SECOND_JOB', name='job_y')
            job3 = self.start_job('echo THIRD_JOB', name='job_x')
            job4 = self.start_job('echo FOURTH_JOB', name='job_w')
            job5 = self.start_job('echo FIFTH_JOB', name='job_v')

            response = self.assert_query_matches(QueryJobsRequest(page_size=2),
                                                 [job4, job5])
            response = self.assert_query_matches(
                QueryJobsRequest(page_size=2,
                                 page_token=response.next_page_token),
                [job2, job3])
            response = self.assert_query_matches(
                QueryJobsRequest(page_size=2,
                                 page_token=response.next_page_token), [job1])

        def test_query_jobs_submission_pagination(self):
            job1 = self.start_job('echo FIRST_JOB', name='job_z')
            time.sleep(1)
            min_time = datetime.datetime.now()
            job2 = self.start_job('echo SECOND_JOB', name='job_y')
            job3 = self.start_job('echo THIRD_JOB', name='job_x')
            job4 = self.start_job('echo FOURTH_JOB', name='job_w')
            job5 = self.start_job('echo FIFTH_JOB', name='job_v')
            job6 = self.start_job('echo SIXTH_JOB', name='job_u')

            response = self.assert_query_matches(
                QueryJobsRequest(page_size=2, submission=min_time),
                [job5, job6])
            response = self.assert_query_matches(
                QueryJobsRequest(page_size=2,
                                 page_token=response.next_page_token,
                                 submission=min_time), [job3, job4])
            response = self.assert_query_matches(
                QueryJobsRequest(page_size=2,
                                 page_token=response.next_page_token,
                                 submission=min_time), [job2])

        def status_counts_to_dict(self, status_counts):
            return {
                status_count.status: status_count.count
                for status_count in status_counts.counts
            }

        def aggregation_response_to_dict(self, aggregation_response):
            # Flatten the nested aggregation response to a dict that is easy to compare equality
            aggregation_response_dict = {
                'summary':
                self.status_counts_to_dict(aggregation_response.summary)
            }

            for aggregation in aggregation_response.aggregations:
                entry_dict = {}

                for entry in aggregation.entries:
                    entry_dict[entry.label] = self.status_counts_to_dict(
                        entry.status_counts)

                aggregation_response_dict[aggregation.key] = entry_dict

            return aggregation_response_dict

        def test_get_job_aggregations(self):
            # Set the current test_token as global config parameter
            # so that the aggregation_controller can filter out unrelated jobs
            current_app.config[
                'AGGREGATION_JOB_LABEL_FILTER'] = "test_token=" + self.test_token_label[
                    'test_token']

            labels = {
                'aggregation-testing-unique-1': 'testing-rocks',
            }

            another_value = {
                'aggregation-testing-unique-1': 'different-value',
            }

            different_labels = {'different-label': 'different-value'}

            running_job_list = []

            # Created a job to be aborted
            job_aborted = self.api_job_id(
                self.start_job('sleep 180', labels=labels, name='agg-aborted'))
            running_job_list.append(job_aborted)
            # Create a job to fail
            job_failed = self.api_job_id(
                self.start_job('not_a_command',
                               labels=labels,
                               name='agg-failed'))
            # Created a succeeded job
            job_succeeded = self.api_job_id(
                self.start_job('echo SUCCEEDED',
                               labels=labels,
                               name='agg-succeeded'))
            # Created a running job
            running_job_list.append(
                self.api_job_id(
                    self.start_job('sleep 180',
                                   labels=labels,
                                   name='agg-running')))
            # Create a running job that has different label values
            running_job_list.append(
                self.api_job_id(
                    self.start_job('sleep 180',
                                   labels=another_value,
                                   name='agg-running')))
            # Create a running job that has different labels
            running_job_list.append(
                self.api_job_id(
                    self.start_job('sleep 180',
                                   labels=different_labels,
                                   name='agg-running')))

            # wait_status need 10s on local provider
            if current_app.config['PROVIDER_TYPE'] == ProviderType.LOCAL:
                time.sleep(10)

            for running_job in running_job_list:
                self.wait_status(running_job, ApiStatus.RUNNING)

            self.must_abort_job(job_aborted)
            self.wait_status(job_aborted, ApiStatus.ABORTED)
            self.wait_status(job_failed, ApiStatus.FAILED)
            self.wait_status(job_succeeded, ApiStatus.SUCCEEDED)

            userId = self.must_get_job(job_succeeded).extensions.user_id
            aggregation_resp = self.must_get_job_aggregations('HOURS_1')

            aggregation_response_dict = self.aggregation_response_to_dict(
                aggregation_resp)

            status_counts_total = {
                'Running': 3,
                'Failed': 1,
                'Succeeded': 1,
                'Aborted': 1
            }

            status_counts_group = {
                'Running': 1,
                'Failed': 1,
                'Succeeded': 1,
                'Aborted': 1
            }

            status_counts_single = {'Running': 1}

            expected_aggregations_response_dict = {
                'summary': status_counts_total,
                'userId': {
                    userId: status_counts_total
                },
                'name': {
                    'agg-aborted': {
                        'Aborted': 1
                    },
                    'agg-failed': {
                        'Failed': 1
                    },
                    'agg-succeeded': {
                        'Succeeded': 1
                    },
                    'agg-running': {
                        'Running': 3
                    }
                },
                'aggregation-testing-unique-1': {
                    'testing-rocks': status_counts_group,
                    'different-value': status_counts_single
                },
                'test_token': {
                    self.test_token_label['test_token']: status_counts_total,
                },
                'different-label': {
                    'different-value': status_counts_single
                }
            }

            self.assertEqual(aggregation_response_dict,
                             expected_aggregations_response_dict)

            # Cancel running jobs for testing
            for running_job in running_job_list:
                self.client.open('/jobs/{}/abort'.format(running_job),
                                 method='POST')
