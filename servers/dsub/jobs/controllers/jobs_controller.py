import apiclient
import requests

from flask import current_app, request
from dateutil.tz import tzlocal
from dsub.commands import ddel, dstat
from dsub.providers import google, local, stub
from werkzeug.exceptions import BadRequest, Forbidden, InternalServerError, NotFound, NotImplemented, PreconditionFailed, Unauthorized

from jm_utils import page_tokens
from jobs.common import execute_redirect_stdout
from jobs.controllers.utils import extensions, failures, job_ids, job_statuses, labels, providers, query_parameters, jobs_generator
from jobs.models.query_jobs_response import QueryJobsResponse
from jobs.models.health_response import HealthResponse
from jobs.models.query_jobs_request import QueryJobsRequest
from jobs.models.job_metadata_response import JobMetadataResponse

_DEFAULT_PAGE_SIZE = 32
_MAX_PAGE_SIZE = 256


def abort_job(id):
    """Abort a job by API Job ID.

    Args:
        id (str): Job ID to be aborted

    Returns: None
    """
    # Attempt is unused in aborting because only one attempt can be running at
    # a time.
    proj_id, job_id, task_id, _ = job_ids.api_to_dsub(id, _provider_type())
    provider = providers.get_provider(_provider_type(), proj_id, _auth_token())

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
    deleted = execute_redirect_stdout(lambda: ddel.ddel_tasks(
        provider=provider,
        job_ids={job_id},
        task_ids={task_id} if task_id else None))
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
    raise NotImplementedError('Label updates not supported by dsub.')


def get_job(id):
    """Get a job's metadata by API Job ID.
    Args:
        id (str): Job ID to get
    Returns:
        JobMetadataResponse: Response containing relevant metadata
    """
    proj_id, job_id, task_id, attempt = job_ids.api_to_dsub(
        id, _provider_type())
    provider = providers.get_provider(_provider_type(), proj_id, _auth_token())

    jobs = []
    try:
        jobs = execute_redirect_stdout(lambda: dstat.dstat_job_producer(
            provider=provider,
            statuses={'*'},
            job_ids={job_id},
            task_ids={task_id} if task_id else None,
            task_attempts={attempt} if attempt else None,
            full_output=True).next())
    except apiclient.errors.HttpError as error:
        _handle_http_error(error, proj_id)

    # A job_id and task_id define a unique job (should only be one)
    if len(jobs) > 1:
        raise BadRequest('Found more than one job with ID {}'.format(id))
    elif len(jobs) == 0:
        raise NotFound('Could not find any jobs with ID {}'.format(id))
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
    proj_id = query.extensions.project_id if query.extensions else None
    provider = providers.get_provider(_provider_type(), proj_id, _auth_token())
    create_time_max, offset_id = page_tokens.decode_create_time_max(
        query.page_token) or (None, None)
    query.page_size = min(query.page_size or _DEFAULT_PAGE_SIZE,
                          _MAX_PAGE_SIZE)

    query.start = query.start.replace(tzinfo=tzlocal()).replace(
        microsecond=0) if query.start else None
    query.end = query.end.replace(tzinfo=tzlocal()).replace(
        microsecond=0) if query.end else None
    if query.submission:
        query.submission = query.submission.replace(tzinfo=tzlocal()).replace(
            microsecond=0)

    if query.page_size < 0:
        raise BadRequest("The pageSize query parameter must be non-negative.")
    if query.start and query.end and query.start >= query.end:
        raise BadRequest("Invalid query: start date must precede end date.")
    if query.start and create_time_max and query.start > create_time_max:
        raise BadRequest(
            "Invalid query: start date is invalid with pagination token.")
    if query.submission:
        if query.start and query.submission > query.start:
            raise BadRequest(
                "Invalid query: submission date must be <= start date.")
        if query.end and query.submission >= query.end:
            raise BadRequest(
                "Invalid query: submission date must precede end date.")

    generator = jobs_generator.generate_jobs(provider, query, create_time_max,
                                             offset_id)
    jobs = []
    try:
        for job in generator:
            jobs.append(job)
            if len(jobs) == query.page_size:
                break
    except apiclient.errors.HttpError as error:
        _handle_http_error(error, proj_id)

    try:
        next_job = generator.next()
        next_ct = next_job.submission
        last_ct = jobs[-1].submission
        offset_id = next_job.id if next_ct == last_ct else None
        token = page_tokens.encode_create_time_max(next_ct, offset_id)
        return QueryJobsResponse(results=jobs, next_page_token=token)
    except StopIteration:
        return QueryJobsResponse(results=jobs)


def health():
    """
    Query for the health of the backend.

    Args:

    Returns:
        HealthResponse: Health of the service and its link to its backend.
    """
    return HealthResponse(available=True)


def get_shard_attempts(id, task, index, **kwargs):
    """
    Query for attempt metadata for a specified job task shard

    :param id: Job ID
    :type id: str

    :param task: Task Name
    :type task: str

    :param index: Shard Index
    :type index: str

    :rtype: JobAttemptsResponse - never actually returned
    """
    raise NotImplementedError('Scattered jobs not supported by dsub.')


def get_task_attempts(id, task, **kwargs):
    """
    Query for attempt metadata for a specified job task

    :param id: Job ID
    :type id: str

    :param task: Task Name
    :type task: str

    :rtype: JobAttemptsResponse - never actually returned
    """
    raise NotImplementedError('Tasks not supported by dsub.')


def _handle_http_error(error, proj_id):
    # TODO(https://github.com/googlegenomics/dsub/issues/79): Push this
    # provider-specific error translation down into dstat.
    if error.resp.status == requests.codes.not_found:
        raise NotFound('Project "{}" not found'.format(proj_id))
    elif error.resp.status == requests.codes.forbidden:
        raise Forbidden('Permission denied for project "{}"'.format(proj_id))
    raise InternalServerError("Unexpected failure getting dsub jobs")


def _metadata_response(id, job):
    return JobMetadataResponse(id=id,
                               status=job_statuses.dsub_to_api(job),
                               submission=job['create-time'],
                               name=job['job-name'],
                               start=job.get('start-time'),
                               end=job['end-time'],
                               inputs=job['inputs'],
                               outputs=job['outputs'],
                               labels=labels.dsub_to_api(job),
                               failures=failures.get_failures(job),
                               extensions=extensions.get_extensions(job))


def _auth_token():
    auth_header = request.headers.get('Authentication')
    if auth_header:
        components = auth_header.split(' ')
        if len(components) == 2 and components[0] == 'Bearer':
            return components[1]
    return None


def _provider_type():
    return current_app.config['PROVIDER_TYPE']
