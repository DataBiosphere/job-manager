import apiclient
import bisect
import connexion
import copy
import datetime
from dateutil.tz import tzlocal
from dsub.commands import ddel, dstat
from dsub.providers import google, local, stub
from dsub.lib import param_util, resources
from flask import current_app, request
import requests
from werkzeug.exceptions import BadRequest, Forbidden, InternalServerError, NotFound, NotImplemented, PreconditionFailed, Unauthorized

from jm_utils import page_tokens
from jobs.common import execute_redirect_stdout
from jobs.controllers.utils import failures, job_ids, job_statuses, labels, logs, providers
from jobs.models.failure_message import FailureMessage
from jobs.models.job_metadata_response import JobMetadataResponse
from jobs.models.query_jobs_response import QueryJobsResponse
from jobs.models.query_jobs_request import QueryJobsRequest
from jobs.models.query_jobs_result import QueryJobsResult

_DEFAULT_PAGE_SIZE = 64
_MAX_PAGE_SIZE = 64


def abort_job(id):
    """Abort a job by API Job ID.

    Args:
        id (str): Job ID to be aborted

    Returns: None
    """
    proj_id, job_id, task_id = job_ids.api_to_dsub(id, _provider_type())
    provider = providers.get_provider(_provider_type(), proj_id, _auth_token())
    # If task-id is not specified, pass None instead of [None]
    task_ids = {task_id} if task_id else None

    # TODO(bryancrampton): Add flag to ddel to support deleting only
    # 'singleton' tasks.
    status = get_job(id).status

    # TODO(https://github.com/googlegenomics/dsub/issues/81): Remove this
    # provider-specific logic
    if isinstance(provider, stub.StubJobProvider):
        status = status[0]

    if status != job_statuses.ApiStatus.RUNNING:
        raise PreconditionFailed(
            'Job already in terminal status `{}`'.format(status))

    # TODO(https://github.com/googlegenomics/dsub/issues/92): Remove this
    # hacky re-routing of stdout once dsub removes it from the python API
    deleted = execute_redirect_stdout(lambda:
        ddel.ddel_tasks(
            provider=provider, job_ids={job_id}, task_ids=task_ids))
    if len(deleted) != 1:
        raise InternalServerError('Failed to abort dsub job')


def update_job_labels(id, body):
    """Update labels on a job.

    Args:
        id (str): Job ID to update
        body (dict): JSON request body

    Returns:
        UpdateJobLabelsResponse: Response - never actually returned
    """
    raise NotImplemented('Label updates not supported by dsub.')


def get_job(id):
    """Get a job's metadata by API Job ID.
    Args:
        id (str): Job ID to get
    Returns:
        JobMetadataResponse: Response containing relevant metadata
    """
    proj_id, job_id, task_id = job_ids.api_to_dsub(id, _provider_type())
    provider = providers.get_provider(_provider_type(), proj_id, _auth_token())

    jobs = []
    try:
        jobs = dstat.dstat_job_producer(
            provider=provider,
            statuses={'*'},
            job_ids={job_id},
            task_ids={task_id} if task_id else None,
            full_output=True).next()
    except apiclient.errors.HttpError as error:
        _handle_http_error(error, proj_id)

    # A job_id and task_id define a unique job (should only be one)
    if len(jobs) > 1:
        raise BadRequest('Found more than one job with ID {}+{}'.format(
            job_id, task_id))
    elif len(jobs) == 0:
        raise NotFound('Could not find any jobs with ID {}+{}'.format(
            job_id, task_id))

    return _metadata_response(id, jobs[0])


def query_jobs(body):
    """
    Query jobs by various filter criteria.

    Args:
        body (dict): The JSON request body.

    Returns:
        QueryJobsResponse: Response containing results from query
    """
    query = QueryJobsRequest.from_dict(body)
    if not query.page_size:
        query.page_size = _DEFAULT_PAGE_SIZE
    elif query.page_size < 0:
        raise BadRequest("The pageSize query parameter must be non-negative.")
    if query.start:
        query.start = query.start.replace(tzinfo=tzlocal()).replace(
            microsecond=0)
    query.page_size = min(query.page_size, _MAX_PAGE_SIZE)
    provider = providers.get_provider(_provider_type(), query.parent_id,
                                      _auth_token())
    create_time_max, offset_id = page_tokens.decode_create_time_max(
        query.page_token) or (None, None)

    jobs = []
    if offset_id and create_time_max:
        if query.start and query.start > create_time_max:
            raise ValueError(
                "Invalid pagination token with query start parameter")

        # The presence of offset_id indicates we are getting a page token in
        # which multiple pages of jobs have the same create-time. We must
        # get all jobs with that create time, sort them by Job ID and calcuate
        # where the offset_id is located within the list.
        create_time_jobs = _query_dstat_jobs_single_create_time(
            provider, query, create_time_max)
        offset_idx = _get_offset_id_index(offset_id, create_time_jobs)
        new_jobs = create_time_jobs[offset_idx:]
        if len(new_jobs) > query.page_size:
            return _get_query_jobs_response(new_jobs[:query.page_size],
                                            query.parent_id, create_time_max,
                                            new_jobs[query.page_size])
        elif query.start and query.start == create_time_max:
            # We are at the end of pagination for the given query.start, return
            # the results with no token
            return _get_query_jobs_response(new_jobs, query.parent_id)
        else:
            jobs = new_jobs
            create_time_max -= datetime.timedelta(seconds=1)

    # Get one additional task than requested to determine if we should return a
    # page_token
    max_tasks = query.page_size - len(jobs) + 1
    more_jobs = _query_dstat_jobs(
        provider, query, create_time_max, max_tasks=max_tasks)
    # We shouldn't get more jobs than requested, but if we do ignore
    # all the extras.
    if len(more_jobs) > max_tasks:
        more_jobs = more_jobs[:max_tasks]

    if len(more_jobs) == 1 and max_tasks == 1:
        # We requested one job to see if there is another page, there is
        # so return the existing jobs and a page_token
        return _get_query_jobs_response(jobs, query.parent_id, create_time_max)
    elif len(more_jobs) >= max_tasks:
        last_create_time = more_jobs[-1]['create-time']
        penult_create_time = more_jobs[-2]['create-time']
        if last_create_time == penult_create_time:
            # The last job in this page has the same create-time as the first
            # job in the next page. We need to get all jobs with this
            # create-time and provide an offset_id with the page_token.
            create_time_jobs = _query_dstat_jobs_single_create_time(
                provider, query, last_create_time)
            # Add all jobs with a different create-time to the already fetched
            # jobs
            create_time_cutoff = _get_create_time_index(
                last_create_time, more_jobs)
            jobs = jobs + more_jobs[:create_time_cutoff]
            # Add enough jobs from the sorted list to fill the page and return
            # a token with this create_time and the offset_id of the first job
            # on the next page
            needed_jobs = query.page_size - len(jobs)
            jobs = jobs + create_time_jobs[:needed_jobs]
            return _get_query_jobs_response(jobs, query.parent_id,
                                            last_create_time,
                                            create_time_jobs[needed_jobs])

        else:
            return _get_query_jobs_response(jobs + more_jobs[:-1],
                                            query.parent_id, last_create_time)
    else:
        # Not enough jobs to fill the page, return everything we have
        # and no page_token
        return _get_query_jobs_response(jobs + more_jobs, query.parent_id)


def _get_query_jobs_response(jobs,
                             project_id,
                             create_time_max=None,
                             job_offset=None):
    results = [_query_result(j, project_id) for j in jobs]
    offset_id = job_offset['job-id'] + job_offset.get(
        'task-id', '') if job_offset else None
    token = page_tokens.encode_create_time_max(create_time_max, offset_id)
    return QueryJobsResponse(results=results, next_page_token=token)


def _query_dstat_jobs(provider, query, create_time_max, max_tasks=0):
    labels = {param_util.LabelParam(k, v)
              for (k, v) in query.labels.items()} if query.labels else set()
    statuses = {job_statuses.api_to_dsub(s)
                for s in query.statuses} if query.statuses else set()

    try:
        jobs = dstat.dstat_job_producer(
            provider=provider,
            statuses=dstat_params['statuses'],
            user_ids=dstat_params.get('user_ids'),
            job_ids=dstat_params.get('job_ids'),
            task_ids=dstat_params.get('task_ids'),
            create_time=dstat_params.get('create_time'),
            job_names=dstat_params.get('job_names'),
            labels=dstat_params.get('labels'),
            full_output=True,
            max_tasks=max_tasks).next()

        # The local provider gives millisecond granularity, trim it to second
        # grunularity for consistency with the google provider
        for j in jobs:
            j['create-time'] = j['create-time'].replace(microsecond=0)
        # Sort returned jobs first by create-time then by job-id + task-id
        return sorted(
            jobs,
            key=
            lambda j: (j['create-time'], j['job-id'] + j.get('task-id', '')))
    except apiclient.errors.HttpError as e:
        _handle_http_error(e, query.parent_id)


def _query_dstat_jobs_single_create_time(provider, query, create_time):
    # Copy the query object and modify its 'start' field
    new_query = copy.deepcopy(query)
    new_query.start = create_time
    return _query_dstat_jobs(provider, new_query, create_time_max=create_time)


def _auth_token():
    auth_header = request.headers.get('Authentication')
    if auth_header:
        components = auth_header.split(' ')
        if len(components) == 2 and components[0] == 'Bearer':
            return components[1]
    return None


def _get_offset_id_index(offset_id, sorted_jobs):
    job_ids = [j['job-id'] + j.get('task-id', '') for j in sorted_jobs]
    return bisect.bisect_left(job_ids, offset_id)


def _get_create_time_index(create_time, sorted_jobs):
    create_times = [j['create-time'] for j in sorted_jobs]
    return bisect.bisect_left(create_times, create_time)


def _handle_http_error(error, proj_id):
    # TODO(https://github.com/googlegenomics/dsub/issues/79): Push this
    # provider-specific error translation down into dstat.
    if error.resp.status == requests.codes.not_found:
        raise NotFound('Project "{}" not found'.format(proj_id))
    elif error.resp.status == requests.codes.forbidden:
        raise Forbidden('Permission denied for project "{}"'.format(proj_id))
    raise InternalServerError("Unexpected failure getting dsub jobs")


def _client():
    return current_app.config['CLIENT']


def _provider_type():
    return current_app.config['PROVIDER_TYPE']


def _query_result(job, project_id=None):
    return QueryJobsResult(
        id=job_ids.dsub_to_api(project_id, job['job-id'], job.get(
            'task-id', '')),
        name=job['job-name'],
        status=job_statuses.dsub_to_api(job),
        submission=job['create-time'],
        start=job.get('start-time'),
        end=job['end-time'],
        labels=labels.dsub_to_api(job))


def _metadata_response(id, job):
    return JobMetadataResponse(
        id=id,
        name=job['job-name'],
        status=job_statuses.dsub_to_api(job),
        submission=job['create-time'],
        start=job.get('start-time'),
        end=job['end-time'],
        inputs=job['inputs'],
        outputs=job['outputs'],
        labels=labels.dsub_to_api(job),
        logs=logs.dsub_to_api(job),
        failures=failures.get_failures(job))
