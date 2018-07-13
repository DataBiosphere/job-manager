# coding: utf-8

from __future__ import absolute_import

from . import BaseTestCase

from jobs.controllers.utils import task_statuses


class TestTaskStatuses(BaseTestCase):
    def test_cromwell_execution_to_api_maps_all_execution_statuses_correctly(self):
        self.assertEqual(task_statuses.cromwell_execution_to_api('NotStarted'), 'Submitted')
        self.assertEqual(task_statuses.cromwell_execution_to_api('WaitingForQueueSpace'), 'Submitted')
        self.assertEqual(task_statuses.cromwell_execution_to_api('QueuedInCromwell'), 'Submitted')
        self.assertEqual(task_statuses.cromwell_execution_to_api('Starting'), 'Submitted')
        self.assertEqual(task_statuses.cromwell_execution_to_api('Running'), 'Running')
        self.assertEqual(task_statuses.cromwell_execution_to_api('Aborting'), 'Aborting')
        self.assertEqual(task_statuses.cromwell_execution_to_api('Unstartable'), 'Failed')
        self.assertEqual(task_statuses.cromwell_execution_to_api('Aborted'), 'Aborted')
        self.assertEqual(task_statuses.cromwell_execution_to_api('Bypassed'), 'Submitted')
        self.assertEqual(task_statuses.cromwell_execution_to_api('RetryableFailure'), 'Running')
        self.assertEqual(task_statuses.cromwell_execution_to_api('Failed'), 'Failed')
        self.assertEqual(task_statuses.cromwell_execution_to_api('Done'), 'Succeeded')

    def test_unrecognized_status_causes_exception(self):
        with self.assertRaises(ValueError):
            task_statuses.cromwell_execution_to_api('Not a valid status')
