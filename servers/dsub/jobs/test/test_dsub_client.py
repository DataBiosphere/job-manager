from __future__ import absolute_import

from werkzeug.exceptions import BadRequest
from jobs.controllers.errors import JobNotFound
from jobs.models.query_jobs_request import QueryJobsRequest
from unittest import TestCase
from dsub.providers import base
from dsub.providers import stub
from jobs.controllers.dsub_client import *
from mock import MagicMock


class TestDSubClient(TestCase):
    """ DSubClient unit tests."""
    OPS = [{
        'job-id': 'job-1',
        'job-name': 'foo',
        'task-id': 'task-1',
        'status': ('RUNNING', '123'),
        'labels': {
            'a_key': 'a_val'
        }
    }, {
        'job-id': 'job-1',
        'job-name': 'foo',
        'task-id': 'task-2',
        'status': ('FAILURE', '234'),
        'labels': {
            'some_key': 'some_value'
        }
    }, {
        'job-id': 'job-2',
        'job-name': 'bar',
        'task-id': 'task-1',
        'status': ('CANCELED', '345'),
        'labels': {
            'different_key': 'some_other_value'
        }
    }, {
        'job-id': 'job-2',
        'job-name': 'bar',
        'task-id': 'task-2',
        'status': ('RUNNING', '456'),
        'labels': {
            'another_key': 'a_third_value'
        }
    }, {
        'job-id': 'job-2',
        'job-name': 'bar',
        'task-id': 'task-3',
        'status': ('RUNNING', '567'),
        'labels': {
            'key4': 'val4'
        }
    }, {
        'job-id': 'job-2',
        'job-name': 'bar',
        'task-id': 'task-4',
        'status': ('RUNNING', '678'),
        'labels': {
            'key5': 'val5'
        }
    }, {
        'job-id': 'job-2',
        'job-name': 'bar',
        'task-id': 'task-5',
        'status': ('RUNNING', '789'),
        'labels': {
            'key6': 'val6'
        }
    }]

    PROVIDER = stub.StubJobProvider()
    CLIENT = DSubClient()

    def setUp(self):
        self.PROVIDER.set_operations(self.OPS)
        super(TestDSubClient, self).setUp()

    def tearDown(self):
        # Reset any methods which are mocked in tests
        # self.PROVIDER.delete_jobs.reset_mock()
        super(TestDSubClient, self).tearDown()

    def _filter_empty_fields(self, tasks):
        return [dict((k, v) for k, v in t.iteritems() if v) for t in tasks]

    def test_get_job(self):
        tasks = [
            self.CLIENT.get_job(self.PROVIDER, 'job-1', 'task-1'),
            self.CLIENT.get_job(self.PROVIDER, 'job-1', 'task-2'),
            self.CLIENT.get_job(self.PROVIDER, 'job-2', 'task-1'),
            self.CLIENT.get_job(self.PROVIDER, 'job-2', 'task-2'),
            self.CLIENT.get_job(self.PROVIDER, 'job-2', 'task-3'),
            self.CLIENT.get_job(self.PROVIDER, 'job-2', 'task-4'),
            self.CLIENT.get_job(self.PROVIDER, 'job-2', 'task-5'),
        ]
        self.assertEqual(self._filter_empty_fields(tasks), self.OPS)

    def test_get_job_conflicting_id(self):
        self.PROVIDER.set_operations([{
            'job-id': 'job-1',
            'job-name': 'foo',
            'task-id': 'task-1',
            'status': ('FAILURE', '234'),
            'labels': {
                'some_key': 'some_value'
            }
        }, {
            'job-id': 'job-1',
            'job-name': 'foo',
            'task-id': 'task-1',
            'status': ('CANCELED', '345'),
            'labels': {
                'different_key': 'some_other_value'
            }
        }])
        with self.assertRaises(BadRequest):
            self.CLIENT.get_job(self.PROVIDER, 'job-1', 'task-1')

    def test_get_job_does_not_exist(self):
        with self.assertRaises(JobNotFound):
            self.CLIENT.get_job(self.PROVIDER, 'missing', 'task-1')

    #
    def test_abort_job(self):
        # We can remove this mock if this issue is resolved:
        # https://github.com/googlegenomics/dsub/issues/65
        self.PROVIDER.delete_jobs = MagicMock(return_value=(self.OPS[1:2], []))
        self.CLIENT.abort_job(self.PROVIDER, 'job-1', 'task-2')
        self.PROVIDER.delete_jobs.assert_called_with(None, ['job-1'],
                                                     ['task-2'], None, None)

    def test_abort_job_does_not_exist(self):
        with self.assertRaises(JobNotFound):
            self.CLIENT.get_job(self.PROVIDER, 'nope', 'task-1')

    def test_query_job_by_name(self):
        tasks_foo = self.CLIENT.query_jobs(
            self.PROVIDER, QueryJobsRequest(name='foo'))
        tasks_bar = self.CLIENT.query_jobs(
            self.PROVIDER, QueryJobsRequest(name='bar'))
        tasks_blah = self.CLIENT.query_jobs(
            self.PROVIDER, QueryJobsRequest(name='blah'))
        self.assertEqual(self._filter_empty_fields(tasks_foo), self.OPS[0:2])
        self.assertEqual(self._filter_empty_fields(tasks_bar), self.OPS[2:])
        self.assertEqual(self._filter_empty_fields(tasks_blah), [])

    def test_query_job_by_status(self):
        running_tasks = self.CLIENT.query_jobs(
            self.PROVIDER, QueryJobsRequest(statuses=['Running']))
        aborted_tasks = self.CLIENT.query_jobs(
            self.PROVIDER, QueryJobsRequest(statuses=['Aborted']))
        failed_tasks = self.CLIENT.query_jobs(
            self.PROVIDER, QueryJobsRequest(statuses=['Failed']))
        self.assertEqual(
            self._filter_empty_fields(running_tasks),
            [self.OPS[0], self.OPS[3], self.OPS[4], self.OPS[5], self.OPS[6]])
        self.assertEqual(
            self._filter_empty_fields(aborted_tasks), [self.OPS[2]])
        self.assertEqual(
            self._filter_empty_fields(failed_tasks), [self.OPS[1]])

    # TODO(bryancrampton): Add support to dsub's StubJobProvider for lookup
    # by create_time and job_name_list and add tests around that here


if __name__ == '__main__':
    import unittest
    unittest.main()
