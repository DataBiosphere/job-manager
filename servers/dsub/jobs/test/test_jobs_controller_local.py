from __future__ import absolute_import

from dsub.providers import local
import operator
import os
import shutil
import tempfile
import time
import unittest

from jobs.test.base_test_cases import BaseTestCases
from jobs.controllers.job_statuses import ApiStatus
from jobs.controllers.dsub_client import DSubClient
from jobs.models.query_jobs_request import QueryJobsRequest

PROCESS_NOT_FOUND_MESSAGE = 'Process not found yet'


class TestJobsControllerLocal(BaseTestCases.JobsControllerTestCase):
    """ JobsController integration tests for local provider """

    @classmethod
    def setUpClass(cls):
        super(TestJobsControllerLocal, cls).setUpClass()
        cls.testing_bucket = 'gs://bvdp-jmui-testing/local'
        cls.provider = local.LocalJobProvider()

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

    def create_app(self):
        app = super(TestJobsControllerLocal, self).create_app()
        app.config.update({
            'CLIENT': DSubClient(),
            'PROVIDER_TYPE': 'local',
            'REQUIRES_AUTH': False,
        })
        return app

    def job_has_status(self, job, status):
        has_status = job.status == status
        if has_status and status == ApiStatus.RUNNING:
            return job.labels['status-detail'] != PROCESS_NOT_FOUND_MESSAGE
        return has_status


if __name__ == '__main__':
    unittest.main()
