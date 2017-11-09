import base64
import connexion
import json
import numbers
from werkzeug.exceptions import BadRequest, NotFound, Forbidden, InternalServerError, PreconditionFailed
from dsub.lib import param_util
from dsub.providers import google, local, stub
from dsub.commands import dstat, ddel
from jobs.common import enum, execute_redirect_stdout
from jobs.controllers.job_statuses import DsubStatus
from errors import *
import apiclient
import job_statuses
import requests

ProviderType = enum(GOOGLE='google', LOCAL='local', STUB='stub')


class DSubClient:
    """Light dsub wrapper which enables easy execution of dstat + ddel commands"""

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

        # TODO(bryancrampton): Add flag to ddel to support deleting only
        # 'singleton' tasks. For now, this will raise an error if more than one
        # jobs or no jobs are found for the given job-id and task-id. Also
        # ensure status is not terminal before aborting.
        job = self.get_job(provider, job_id, task_id)
        status = job['status']

        # TODO(https://github.com/googlegenomics/dsub/issues/81): Remove this
        # provider-specific logic
        if isinstance(provider, stub.StubJobProvider):
            status = status[0]

        if status != DsubStatus.RUNNING:
            raise PreconditionFailed(
                'Job already in terminal status: {}'.format(job['status']))

        # TODO(https://github.com/googlegenomics/dsub/issues/92): Remove this
        # hacky re-routing of stdout once dsub removes it from the python API
        deleted = execute_redirect_stdout(lambda:
            ddel.ddel_tasks(
                provider=provider, job_list=[job_id], task_list=task_list))
        if len(deleted) != 1:
            raise InternalServerError('failed to abort dsub job')

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

    def _encode_jobs_page_token(self, offset):
        """Encode the jobs pagination token.

        We implement the pagination token via base64-encoded JSON s.t. tokens are
        opaque to clients and enable us to make backwards compatible changes to our
        pagination implementation. Base64+JSON are used specifically as they are
        easily portable across language.

        Args:
          offset: (int) index into the overall list of jobs matching the query
        Returns:
          (string) encoded page token representing a page of jobs
        """
        s = json.dumps({
            'of': offset,
        })
        # Strip ugly base64 padding.
        return base64.urlsafe_b64encode(s).rstrip('=')

    def _decode_jobs_page_token(self, token):
        """Decode the jobs pagination token.

        Args:
          token: (string) base64 encoded JSON pagination token

        Returns:
          (number) the pagination offset
        """
        # Pad the token out to be divisible by 4.
        padded_token = token + '=' * (4 - (len(token) % 4))
        tok = base64.urlsafe_b64decode(padded_token)
        tok_dict = json.loads(tok)
        offset = tok_dict.get('of')
        if not offset or not isinstance(offset, numbers.Number) or offset <= 0:
            raise ValueError('invalid token JSON {}'.format(tok_dict))
        return offset

    def query_jobs(self, provider, query):
        """Query dsub jobs or tasks based on their metadata

        Args:
            params (QueryJobsRequest): defined in swagger API spec, a positive
              page_size must be set

        Returns:
            list<dict>: a list of raw metadata for all jobs matching the query
            string: token for retrieving the next page
        """
        dstat_params = self._query_parameters(query)

        # TODO(bryancrampton): support 'end_time' query parameter. First update
        # to filter by end_time once dsub LocalJobsProvider supports it.
        # https://github.com/googlegenomics/dsub/issues/90
        # Eventually, the pipelines API and dsub should support this query .

        # TODO(https://github.com/googlegenomics/dsub/issues/69): Move this
        # logic into dsub.
        statuses = dstat_params['statuses']
        if not statuses:
            statuses = ['*']
        if query.page_size <= 0:
            raise ValueError("page_size must be positive")

        offset = 0
        # Request one extra job to confirm whether there's more data to return
        # in a subsequent page.
        max_tasks = query.page_size + 1
        if query.page_token:
            offset = self._decode_jobs_page_token(query.page_token)
            max_tasks += offset

        jobs = []
        try:
            jobs = dstat.dstat_job_producer(
                provider=provider,
                status_list=statuses,
                create_time=dstat_params['create_time'],
                job_name_list=dstat_params['job_name_list'],
                label_list=dstat_params['label_list'],
                full_output=True,
                max_tasks=max_tasks).next()
        except apiclient.errors.HttpError as e:
            # TODO(https://github.com/googlegenomics/dsub/issues/79): Push this
            # provider-specific error translation down into dstat.
            if e.resp.status == requests.codes.not_found:
                raise NotFound(
                    'Project "{}" not found'.format(query.parent_id))
            elif e.resp.status == requests.codes.forbidden:
                raise Forbidden('Permission denied for project "{}"'.format(
                    query.parent_id))
            raise InternalServerError("Unexpected failure querying dsub jobs")

        # This pagination strategy is very inefficient and brittle. Paginating
        # the entire collection of jobs requires O(n^2 / p) work, where n is the
        # number of jobs and p is the page size. This is a first pass
        # implementation which allows for quick lookup of the first page of
        # operations which is the expected common usage pattern for clients.
        # The current approach also uses a numeric offset, which is brittle in
        # that new jobs may be created/deleted mid-pagination, causing other
        # elements to be duplicated or disappear in the overall pagination
        # stream.
        # TODO(calbach): Fix the above issues once pagination is supported in
        # the dstat library.
        if len(jobs) <= offset:
            return [], None
        next_offset = offset + query.page_size
        if len(jobs) > next_offset:
            return jobs[offset:next_offset], self._encode_jobs_page_token(
                next_offset)
        return jobs[offset:], None

    def _query_parameters(self, query):
        dstat_params = {
            'create_time': query.start,
            'end_time': query.end,
            'job_name_list': [query.name] if query.name else None,
            'statuses': None,
            'label_list': None
        }

        if query.statuses:
            status_set = set(
                [job_statuses.api_to_dsub(s) for s in query.statuses])
            dstat_params['statuses'] = list(status_set)

        if query.labels:
            dstat_params['label_list'] = [
                param_util.LabelParam(k, v) for (k, v) in query.labels.items()
            ]

        return dstat_params
