import connexion
from werkzeug.exceptions import BadRequest
from dsub.providers import local
from dsub.providers import google
from dsub.providers import stub
from dsub.commands import dstat
from dsub.commands import ddel
from jobs.common import enum
from errors import *
import job_statuses

ProviderType = enum(GOOGLE='google', LOCAL='local', STUB='stub')


class DSubClient:
    """Light dsub wrapper which enables easy execution of dstat + ddel commands"""

    # TODO(bryancrampton) support injecting credentials for Google provider type

    def get_job(self, provider, job_id, task_id):
        """Get metadata for a particular dsub job or task (if it exists).

        Args:
            provider (JobProvider): dsub provider to monitor and abort tasks
            job_id (str): dsub job-id
            tasK_id (str): dsub task-id (usually task-N)

        Note:
            See https://github.com/googlegenomics/dsub#viewing-job-status for
            a description of dsub job-id and task-id formats

        Returns:
            dict: raw JSON metadata for the job or task
        """
        # If task-id is not specified, pass None instead of [None]
        task_list = [task_id] if task_id else None

        # dstat_job_producer returns a generator of lists of task dictionaries.
        # poll_interval is implicitly set to 0 so there should be a single list.
        jobs = dstat.dstat_job_producer(
            provider=provider,
            status_list=['*'],
            job_list=[job_id],
            task_list=task_list,
            full_output=True).next()

        # A job_id and task_id define a unique job (should only be one)
        if len(jobs) > 1:
            raise BadRequest('Found more than one job with ID {}:{}'.format(
                job_id, task_id))
        elif len(jobs) == 0:
            raise JobNotFound('Could not find any jobs with ID {}:{}'.format(
                job_id, task_id))

        return jobs[0]

    def abort_job(self, provider, job_id, task_id):
        """Abort the dsub job or task (if it exists).

        Args:
            provider (JobProvider): dsub provider to monitor and abort tasks
            job_id (str): dsub job-id
            tasK_id (str): dsub task-id (usually task-N)

        Returns:
            dict: raw JSON metadata for the aborted job or task
        """
        # If task-id is not specified, pass None instead of [None]
        task_list = [task_id] if task_id else None

        # TODO(bryancrampton) Add flag to ddel to support deleting only
        # 'singleton' tasks. For now, this will raise an error if more than one
        # jobs or no jobs are found for the given job-id and task-id
        self.get_job(provider, job_id, task_id)
        tasks = ddel.ddel_tasks(
            provider=provider, job_list=[job_id], task_list=task_list)

    def query_jobs(self, provider, query):
        """Query dsub jobs or tasks based on their metadata

        Args:
            params (QueryJobsResult): defined in swagger API spec

        Returns:
            list<dict>: A list of raw metadata for all jobs matching the query.
        """
        dstat_params = self._query_parameters(query)

        # TODO(bryancrampton) support 'end_time' query parameter. First update
        # to filter by end_time once dsub LocalJobsProvider supports it.
        # https://github.com/googlegenomics/dsub/issues/67
        # Eventually, the pipelines API and dsub should support this query .

        jobs = dstat.dstat_job_producer(
            provider=provider,
            status_list=dstat_params['statuses'],
            create_time=dstat_params['create_time'],
            job_name_list=dstat_params['job_name_list'],
            full_output=True).next()

        return jobs

    def _query_parameters(self, query):
        dstat_params = {
            'create_time': query.start,
            'end_time': query.end,
            'job_name_list': [query.name] if query.name else None,
            'statuses': None,
        }

        if query.statuses:
            status_set = set(query.statuses)
            dstat_params['statuses'] = [
                job_statuses.api_to_dsub(s) for s in status_set
            ]

        return dstat_params
