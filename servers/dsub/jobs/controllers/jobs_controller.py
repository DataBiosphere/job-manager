import apiclient
import connexion
from datetime import datetime
from dateutil.tz import tzlocal
from dsub.commands import ddel, dstat
from dsub.providers import google, local, stub
from dsub.lib import resources
from flask import current_app, request
import requests
from werkzeug.exceptions import BadRequest, Forbidden, InternalServerError, NotFound, NotImplemented, PreconditionFailed, Unauthorized

from jm_utils import page_tokens
from jobs.common import execute_redirect_stdout
from jobs.controllers.utils import failures, job_ids, job_statuses, labels, logs, providers, query_parameters
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
        raise BadRequest('Found more than one job with ID {}:{}'.format(
            job_id, task_id))
    elif len(jobs) == 0:
        raise NotFound('Could not find any jobs with ID {}:{}'.format(
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
        query.start = query.start.replace(tzinfo=tzlocal())
    query.page_size = min(query.page_size, _MAX_PAGE_SIZE)
    provider = providers.get_provider(_provider_type(), query.parent_id,
                                      _auth_token())

    dstat_params = query_parameters.api_to_dsub(query)

    if query.page_size <= 0:
        raise ValueError("The page_size parameter must be positive")

    # Request one extra job to confirm whether there's more data to return
    # in a subsequent page.
    offset = page_tokens.decode_offset(query.page_token) or 0
    max_tasks = offset + query.page_size + 1

    jobs = []
    try:
        jobs = dstat.dstat_job_producer(
            provider=provider,
            statuses=dstat_params['statuses'],
            create_time=dstat_params['create_time'],
            job_names=dstat_params['job_names'],
            labels=dstat_params['labels'],
            full_output=True,
            max_tasks=max_tasks).next()
    except apiclient.errors.HttpError as error:
        _handle_http_error(error, query.parent_id)

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
    next_page_token = None
    next_offset = offset + query.page_size
    if len(jobs) > next_offset:
        jobs = jobs[offset:next_offset]
        next_page_token = page_tokens.encode_offset(next_offset)
    elif len(jobs) == next_offset:
        jobs = jobs[offset:]

    results = [_query_result(j, query.parent_id) for j in jobs]
    return QueryJobsResponse(results=results, next_page_token=next_page_token)


def _auth_token():
    auth_header = request.headers.get('Authentication')
    if auth_header:
        components = auth_header.split(' ')
        if len(components) == 2 and components[0] == 'Bearer':
            return components[1]
    return None


def _client():
    return current_app.config['CLIENT']


def _handle_http_error(error, parent_id):
    # TODO(https://github.com/googlegenomics/dsub/issues/79): Push this
    # provider-specific error translation down into dstat.
    if error.resp.status == requests.codes.not_found:
        raise NotFound('Project "{}" not found'.format(parent_id))
    elif error.resp.status == requests.codes.forbidden:
        raise Forbidden('Permission denied for project "{}"'.format(parent_id))
    raise InternalServerError("Unexpected failure running dstat")


def _provider_type():
    return current_app.config['PROVIDER_TYPE']


def _query_result(job, project_id=None):
    return QueryJobsResult(
        id=job_ids.dsub_to_api(project_id, job['job-id'], job.get('task-id')),
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
