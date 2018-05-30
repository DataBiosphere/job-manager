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
from jobs.controllers.utils import extensions, failures, job_ids, job_statuses, labels, providers, query_parameters
from jobs.models.failure_message import FailureMessage
from jobs.models.job_metadata_response import JobMetadataResponse
from jobs.models.query_jobs_response import QueryJobsResponse
from jobs.models.query_jobs_request import QueryJobsRequest
from jobs.models.query_jobs_result import QueryJobsResult

_DEFAULT_PAGE_SIZE = 32
_MAX_PAGE_SIZE = 256


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
        jobs = execute_redirect_stdout(lambda: dstat.dstat_job_producer(
            provider=provider,
            statuses={'*'},
            job_ids={job_id},
            task_ids={task_id} if task_id else None,
            full_output=True).next())
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
    if query.extensions and query.extensions.submission:
        query.extensions.submission = query.extensions.submission.replace(
            tzinfo=tzlocal()).replace(microsecond=0)

    if query.page_size < 0:
        raise BadRequest("The pageSize query parameter must be non-negative.")
    if query.start and query.end and query.start >= query.end:
        raise BadRequest("Invalid query: start date must precede end date.")
    if query.start and create_time_max and query.start > create_time_max:
        raise BadRequest(
            "Invalid query: start date is invalid with pagination token.")
    if query.extensions and query.extensions.submission:
        if query.start and query.extensions.submission > query.start:
            raise BadRequest(
                "Invalid query: submission date must be <= start date.")
        if query.end and query.extensions.submission >= query.end:
            raise BadRequest(
                "Invalid query: submission date must precede end date.")

    job_generator = _generate_jobs(provider, query, create_time_max, offset_id)
    jobs = []
    try:
        for job in job_generator:
            jobs.append(job)
            if len(jobs) == query.page_size:
                break
    except apiclient.errors.HttpError as error:
        _handle_http_error(error, proj_id)

    try:
        next_job = job_generator.next()
        next_ct = next_job.submission
        last_ct = jobs[-1].submission
        offset_id = next_job.id if next_ct == last_ct else None
        token = page_tokens.encode_create_time_max(next_ct, offset_id)
        return QueryJobsResponse(results=jobs, next_page_token=token)
    except StopIteration:
        return QueryJobsResponse(results=jobs)


def _auth_token():
    auth_header = request.headers.get('Authentication')
    if auth_header:
        components = auth_header.split(' ')
        if len(components) == 2 and components[0] == 'Bearer':
            return components[1]
    return None


def _generate_jobs(provider, query, create_time_max=None, offset_id=None):
    proj_id = query.extensions.project_id if query.extensions else None
    # If create_time_max is not set, but we have to client-side filter by
    # end-time, set create_time_max = query.end because all the jobs with
    # create_time >= query.end cannot possibly match the query.
    if not create_time_max and query.end:
        create_time_max = query.end

    dstat_params = query_parameters.api_to_dsub(query)
    jobs = execute_redirect_stdout(lambda: dstat.lookup_job_tasks(
        provider=provider,
        statuses=dstat_params['statuses'],
        user_ids=dstat_params.get('user_ids'),
        job_ids=dstat_params.get('job_ids'),
        task_ids=dstat_params.get('task_ids'),
        create_time_min=dstat_params.get('create_time'),
        create_time_max=create_time_max,
        job_names=dstat_params.get('job_names'),
        labels=dstat_params.get('labels')))

    last_create_time = None
    job_buffer = []
    for j in jobs:
        job = _query_jobs_result(j, proj_id)
        # Filter pending vs. running jobs since dstat does not have
        # a corresponding status (both RUNNING)
        if query.statuses and job.status not in query.statuses:
            continue
        if query.start and (not job.start or job.start < query.start):
            continue
        if query.end and (not job.end or job.end > query.end):
            continue

        # If this job is from the last page, skip it and continue generating
        if create_time_max and job.submission == create_time_max:
            if offset_id and job.id < offset_id:
                continue

        # Build up a buffer of jobs with the same create time. Once we get a
        # job with an older create time we yield all the jobs in the buffer
        # sorted by job-id + task-id
        job_buffer.append(job)
        if job.submission != last_create_time:
            for j in sorted(job_buffer, key=lambda j: j.id):
                yield j
            job_buffer = []
        last_create_time = job.submission

    # If we hit the end of the dstat job generator, ensure to yield the jobs
    # stored in the buffer before returning
    for j in sorted(job_buffer, key=lambda j: j.id):
        yield j


def _handle_http_error(error, proj_id):
    # TODO(https://github.com/googlegenomics/dsub/issues/79): Push this
    # provider-specific error translation down into dstat.
    if error.resp.status == requests.codes.not_found:
        raise NotFound('Project "{}" not found'.format(proj_id))
    elif error.resp.status == requests.codes.forbidden:
        raise Forbidden('Permission denied for project "{}"'.format(proj_id))
    raise InternalServerError("Unexpected failure getting dsub jobs")


def _metadata_response(id, job):
    print "metadata-response called"
    return JobMetadataResponse(
        id=id,
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


def _provider_type():
    return current_app.config['PROVIDER_TYPE']


def _query_jobs_result(job, project_id=None):
    return QueryJobsResult(
        id=job_ids.dsub_to_api(project_id, job['job-id'], job.get('task-id')),
        name=job['job-name'],
        status=job_statuses.dsub_to_api(job),
        # The LocalJobProvider returns create-time with milliescond granularity.
        # For consistency with the GoogleJobProvider, truncate to second
        # granularity.
        submission=job['create-time'].replace(microsecond=0),
        start=job.get('start-time'),
        end=job['end-time'],
        labels=labels.dsub_to_api(job),
        extensions=extensions.get_extensions(job))
