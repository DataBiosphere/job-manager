# coding: utf-8

from __future__ import absolute_import

from . import BaseTestCase

from jobs.controllers.utils import task_statuses
from jobs.controllers import jobs_controller
from jobs.models.shard import Shard

import itertools


class TestTaskStatuses(BaseTestCase):
    # yapf: disable
    def test_cromwell_execution_to_api_maps_all_task_execution_statuses_correctly(self):
        self.assertEqual(task_statuses.cromwell_execution_to_api('NotStarted'), 'Submitted')
        self.assertEqual(task_statuses.cromwell_execution_to_api('WaitingForQueueSpace'), 'Submitted')
        self.assertEqual(task_statuses.cromwell_execution_to_api('QueuedInCromwell'), 'Submitted')
        self.assertEqual(task_statuses.cromwell_execution_to_api('Starting'), 'Submitted')
        self.assertEqual(task_statuses.cromwell_execution_to_api('Running'), 'Running')
        self.assertEqual(task_statuses.cromwell_execution_to_api('Aborting'), 'Aborting')
        self.assertEqual(task_statuses.cromwell_execution_to_api('Unstartable'), 'Failed')
        self.assertEqual(task_statuses.cromwell_execution_to_api('Aborted'), 'Aborted')
        self.assertEqual(task_statuses.cromwell_execution_to_api('Bypassed'), 'Submitted')
        self.assertEqual(task_statuses.cromwell_execution_to_api('RetryableFailure'), 'Failed')
        self.assertEqual(task_statuses.cromwell_execution_to_api('Failed'), 'Failed')
        self.assertEqual(task_statuses.cromwell_execution_to_api('Done'), 'Succeeded')
    # yapf: enable

    def test_unrecognized_task_status_causes_exception(self):
        with self.assertRaises(ValueError):
            task_statuses.cromwell_execution_to_api('Not a valid task status')

    def test_scattered_task_status(self):
        def failed_scattered_task():
            return [
                Shard(execution_status='Failed'),
                Shard(execution_status='Aborting'),
                Shard(execution_status='Aborted'),
                Shard(execution_status='Running'),
                Shard(execution_status='Submitted'),
                Shard(execution_status='Succeeded')
            ]

        for response in itertools.permutations(failed_scattered_task(), 6):
            self.assertEqual(
                jobs_controller._get_scattered_task_status(response), 'Failed')

        def aborting_scattered_task():
            return [
                Shard(execution_status='Aborting'),
                Shard(execution_status='Aborted'),
                Shard(execution_status='Running'),
                Shard(execution_status='Submitted'),
                Shard(execution_status='Succeeded')
            ]

        for response in itertools.permutations(aborting_scattered_task(), 5):
            self.assertEqual(
                jobs_controller._get_scattered_task_status(response),
                'Aborting')

        def aborted_scattered_task():
            return [
                Shard(execution_status='Aborted'),
                Shard(execution_status='Running'),
                Shard(execution_status='Submitted'),
                Shard(execution_status='Succeeded')
            ]

        for response in itertools.permutations(aborted_scattered_task(), 4):
            self.assertEqual(
                jobs_controller._get_scattered_task_status(response),
                'Aborted')

        def running_scattered_task():
            return [
                Shard(execution_status='Running'),
                Shard(execution_status='Submitted'),
                Shard(execution_status='Succeeded')
            ]

        for response in itertools.permutations(running_scattered_task(), 3):
            self.assertEqual(
                jobs_controller._get_scattered_task_status(response),
                'Running')

        def submitted_scattered_task():
            return [
                Shard(execution_status='Submitted'),
                Shard(execution_status='Succeeded')
            ]

        for response in itertools.permutations(submitted_scattered_task(), 2):
            self.assertEqual(
                jobs_controller._get_scattered_task_status(response),
                'Submitted')
