# coding: utf-8

from __future__ import absolute_import

from jobs.controllers.utils import job_statuses

from . import BaseTestCase


class TestJobStatuses(BaseTestCase):

    def test_cromwell_execution_status_converts_correctly(self):
        for key, status in job_statuses.ApiStatus.__dict__.items():
            if not key.startswith('__'):
                converted = job_statuses.cromwell_workflow_status_to_api(
                    job_statuses.api_workflow_status_to_cromwell(status))
                self.assertEqual(status, converted)

    def test_unrecognized_job_status_causes_exception(self):
        with self.assertRaises(ValueError):
            job_statuses.cromwell_workflow_status_to_api(
                'Not a valid job status')
