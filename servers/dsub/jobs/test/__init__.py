import connexion
import logging
import os
import random
import string
import time
from dsub.commands import dsub
from dsub.lib import job_util, param_util
from dsub.providers import local
from flask import json
from flask_testing import TestCase
from jobs.controllers.job_statuses import ApiStatus
from jobs.controllers.dsub_client import DSubClient
from jobs.encoder import JSONEncoder
from jobs.models.job_metadata_response import JobMetadataResponse
from jobs.models.query_jobs_response import QueryJobsResponse

PROCESS_NOT_FOUND_MESSAGE = 'Process not found yet'
DOCKER_IMAGE = 'ubuntu:14.04'


class BaseTestCase(TestCase):
    def create_app(self):
        logging.getLogger('connexion.operation').setLevel('ERROR')
        app = connexion.App(__name__, specification_dir='../swagger/')
        app.app.json_encoder = JSONEncoder
        app.add_api('swagger.yaml')
        app.app.config.update({
            'PROVIDER_TYPE': 'local',
            'CLIENT': DSubClient()
        })
        return app.app

    def assertStatus(self, response, want, desc=None):
        if not desc:
            desc = 'Response body is : ' + response.data.decode('utf-8')
        super(BaseTestCase, self).assertStatus(response, want, desc)

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
        resources = job_util.JobResources(image=DOCKER_IMAGE, logging=logging)

        env_data = [param_util.EnvParam(k, v) for (k, v) in envs.items()]
        label_data = [param_util.LabelParam(k, v) for (k, v) in labels.items()]

        # This is mostly an extraction dsubs argument parsing here:
        # https://github.com/googlegenomics/dsub/blob/master/dsub/lib/param_util.py#L720
        # Reworked it to handle dictionaries rather than a list of items
        # of the form 'key=val'
        input_file_param_util = param_util.InputFileParamUtil('input')
        input_data = []
        for (recursive, items) in ((False, inputs.items()),
                                   (True, inputs_recursive.items())):
            for (name, value) in items:
                name = input_file_param_util.get_variable_name(name)
                input_data.append(
                    input_file_param_util.make_param(name, value, recursive))

        output_file_param_util = param_util.OutputFileParamUtil('output')
        output_data = []
        for (recursive, items) in ((False, outputs.items()),
                                   (True, outputs_recursive.items())):
            for (name, value) in items:
                name = output_file_param_util.get_variable_name(name)
                output_data.append(
                    output_file_param_util.make_param(name, value, recursive))

        all_task_data = [{
            'envs': env_data,
            'labels': label_data,
            'inputs': input_data,
            'outputs': output_data,
        }]

        return dsub.run(
            # TODO(bryancrampton) Set this as a class var once dsub is updated
            # to remove provider_root_cache
            local.LocalJobProvider(),
            resources,
            all_task_data,
            name=name,
            command=command,
            wait=wait,
            disable_warning=True)

    def random_word(self, length):
        letters = string.ascii_lowercase
        return ''.join(random.choice(letters) for i in range(length))

    def create_input_file(self):
        inputs_dir = '{}/input'.format(self.job_path)
        input_file_name = self.random_word(10)
        input_file_path = '{}/{}'.format(inputs_dir, input_file_name)
        os.mkdir(inputs_dir)
        os.mknod(input_file_path)
        return input_file_path

    def expected_log_files(self, job_id):
        return {
            'log-controller': '{}/{}.log'.format(self.log_path, job_id),
            'log-stderr': '{}/{}-stderr.log'.format(self.log_path, job_id),
            'log-stdout': '{}/{}-stdout.log'.format(self.log_path, job_id),
        }

    def must_abort_job(self, job_id):
        resp = self.client.open('/jobs/{}/abort'.format(job_id), method='POST')
        self.assertStatus(resp, 200)

    def must_get_job(self, job_id):
        resp = self.client.open('/jobs/{}'.format(job_id), method='GET')
        self.assertStatus(resp, 200)
        return JobMetadataResponse.from_dict(resp.json)

    def must_query_jobs(self, parameters):
        resp = self.client.open(
            '/jobs/query',
            method='POST',
            data=json.dumps(parameters),
            content_type='application/json')
        self.assertStatus(resp, 200)
        return QueryJobsResponse.from_dict(resp.json)

    def wait_for_job_status(self,
                            job_id,
                            status,
                            poll_interval=0.5,
                            total_time=30):
        has_status = False
        while not has_status and (total_time is None or total_time > 0):
            has_status = self.job_has_status(self.must_get_job(job_id), status)
            time.sleep(poll_interval)
            if total_time is not None:
                total_time -= poll_interval

        if total_time <= 0:
            raise Exception(
                'Wait for job \'{}\' to be \'{}\' timed out after {} seconds'
                .format(job_id, status, total_time))

    def job_has_status(self, job, status):
        has_status = job.status == status
        if has_status and status == ApiStatus.RUNNING:
            return job.labels['status-detail'] != PROCESS_NOT_FOUND_MESSAGE
        return has_status
