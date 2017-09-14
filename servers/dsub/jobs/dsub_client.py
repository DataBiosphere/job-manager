from dsub.providers import local
from dsub.providers import google
from dsub.providers import stub
from dsub.commands import dstat
from dsub.commands import ddel
from jobs.common import enum

ProviderType = enum(GOOGLE=0, LOCAL=1, STUB=2, UNKNOWN=3)


class ConflictingId(Exception):
    pass


class DoesNotExist(Exception):
    pass


class DSubClient:
    """Light dsub wrapper which enables easy execution of dstat + ddel commands"""

    # TODO(bryancrampton) Once dsub exposes valid statuses update this map
    # to use the constant/enum https://github.com/googlegenomics/dsub/issues/66
    STATUS_MAP = {
        'Submitted': 'RUNNING',
        'Running': 'RUNNING',
        'Aborting': 'RUNNING',
        'Aborted': 'CANCELED',
        'Succeeded': 'SUCCESS',
        'Failed': 'FAILURE',
    }

    PROVIDER_MAP = {
        local.LocalJobProvider: ProviderType.LOCAL,
        google.GoogleJobProvider: ProviderType.GOOGLE,
        stub.StubJobProvider: ProviderType.STUB,
    }

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
        Raises:
            ConflictingId: If multiple tasks are found with the same job-id and
                           task-id
            DoesNotExist: If no tasks exist with the given job-id and task-id

        """
        # dstat_job_producer returns a generator of lists of task dictionaries.
        # poll_interval is implicitly set to 0 so there should be a single list.
        jobs = dstat.dstat_job_producer(
            provider=provider,
            status_list=['*'],
            job_list=[job_id],
            task_list=[task_id],
            raw_format=True).next()

        # A job_id and task_id define a unique job (should only be one)
        if len(jobs) > 1:
            raise ConflictingId('Found more than one job with ID {}:{}'.format(
                job_id, task_id))
        elif len(jobs) == 0:
            raise DoesNotExist('Could not find any jobs with ID {}:{}'.format(
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
        Raises:
            ConflictingId: If multiple tasks are found with the same job-id and
                           task-id
            DoesNotExist: If no tasks exist with the given job-id and task-id
        """

        jobs = ddel.ddel_tasks(
            provider=provider, job_list=[job_id], task_list=[task_id])
        if len(jobs) > 1:
            raise ConflictingId(
                "Found more than one job with ID:{}.".format(id))
        elif len(jobs) == 0:
            raise DoesNotExist('Could not find any jobs with ID {}:{}'.format(
                job_id, task_id))

        return jobs[0]

    def query_jobs(self, provider, query):
        """Query dsub jobs or tasks based on their metadata

        Args:
            params (JobQueryRequest): defined in swagger API spec

        Returns:
            list<dict>: A list of raw metadata for all jobs matching the query.
        """
        dstat_params = self._query_parameters(query)

        # TODO(bryancrampton) support 'end_time' query parameter either within
        # dsub or by filtering results after the fact

        jobs = dstat.dstat_job_producer(
            provider=provider,
            status_list=dstat_params['statuses'],
            create_time=dstat_params['create_time'],
            job_name_list=dstat_params['job_name_list'],
            raw_format=True).next()
        return jobs

    def _query_parameters(self, query):
        dstat_params = {
            'create_time': query.start,
            'end_time': query.end,
            'job_name_list': [query.name] if query.name else None,
            'statuses': None,
        }

        if query.statuses:
            # Flask validator of API spec ensures only valid statuses are
            # passed as parameters so these should always exist in STATUS_MAP
            status_set = set(query.statuses)
            dstat_params['statuses'] = [self.STATUS_MAP[s] for s in status_set]

        return dstat_params
