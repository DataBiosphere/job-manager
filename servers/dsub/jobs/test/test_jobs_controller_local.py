from __future__ import absolute_import

from dsub.providers import local
from dsub.lib import resources
import operator
import os
import shutil
import tempfile
import time
import unittest

from jobs.test.base_test_cases import BaseTestCases
from jobs.controllers.utils.job_statuses import ApiStatus
from jobs.models.query_jobs_request import QueryJobsRequest

PROCESS_NOT_FOUND_MESSAGE = 'Process not found yet'


class TestJobsControllerLocal(BaseTestCases.JobsControllerTestCase):
    """ JobsController integration tests for local provider """
    @classmethod
    def setUpClass(cls):
        super(TestJobsControllerLocal, cls).setUpClass()
        # TODO(https://github.com/googlegenomics/dsub/issues/93): Remove
        # resources parameter and import
        cls.provider = local.LocalJobProvider(resources)

    def setUp(self):
        self.testing_root = tempfile.mkdtemp()
        # Set env variable read by dsub to store files for the local provider
        tempfile.tempdir = self.testing_root
        # Create logging directory
        self.log_path = '{}/logging'.format(self.testing_root)
        os.mkdir(self.log_path)
        super(TestJobsControllerLocal, self).setUp()

    def tearDown(self):
        if os.environ.get('KEEP_TEST_DSUB_FILES') != 'true':
            shutil.rmtree(self.testing_root)
        tempfile.tempdir = None

    def create_app(self):
        app = super(TestJobsControllerLocal, self).create_app()
        app.config.update({
            'PROVIDER_TYPE': 'local',
            'REQUIRES_AUTH': False,
        })
        return app

    def job_has_status(self, job, status):
        has_status = job.status == status
        if has_status and status == ApiStatus.RUNNING:
            return not job.extensions or not job.extensions.status_detail or job.extensions.status_detail != PROCESS_NOT_FOUND_MESSAGE
        return has_status

    def test_abort_job(self):
        started = self.start_job('sleep 30')
        api_job_id = self.api_job_id(started)
        # TODO(https://github.com/googlegenomics/dsub/issues/101): Remove
        # this sleep once the local and google statuses are consistent
        time.sleep(10)
        self.wait_status(api_job_id, ApiStatus.RUNNING)
        self.must_abort_job(api_job_id)
        self.wait_status(api_job_id, ApiStatus.ABORTED)

    def test_get_succeeded_job(self):
        inputs_dir = '{}/inputs'.format(self.testing_root)
        outputs_dir = '{}/outputs'.format(self.testing_root)
        os.mkdir(inputs_dir)
        os.mkdir(outputs_dir)
        input_file_path = '{}/test-input'.format(inputs_dir)
        os.mknod(input_file_path)
        super(TestJobsControllerLocal, self).test_get_succeeded_job()


if __name__ == '__main__':
    unittest.main()
