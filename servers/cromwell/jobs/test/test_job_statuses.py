# coding: utf-8

from __future__ import absolute_import

from . import BaseTestCase

from jobs.controllers.utils import job_statuses


class TestJobStatuses(BaseTestCase):
    # yapf: disable
    def test_cromwell_execution_to_api_maps_all_job_execution_statuses_correctly(self):
        self.assertEqual(job_statuses.cromwell_execution_to_api('Submitted'), 'Submitted')
        self.assertEqual(job_statuses.cromwell_execution_to_api('Running'), 'Running')
        self.assertEqual(job_statuses.cromwell_execution_to_api('On hold'), 'OnHold')
        self.assertEqual(job_statuses.cromwell_execution_to_api('Aborting'), 'Aborting')
        self.assertEqual(job_statuses.cromwell_execution_to_api('Aborted'), 'Aborted')
        self.assertEqual(job_statuses.cromwell_execution_to_api('Failed'), 'Failed')
        self.assertEqual(job_statuses.cromwell_execution_to_api('Succeeded'), 'Succeeded')
    # yapf: enable

    def test_unrecognized_job_status_causes_exception(self):
        with self.assertRaises(ValueError):
            job_statuses.cromwell_execution_to_api('Not a valid status')
