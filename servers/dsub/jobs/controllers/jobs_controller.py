import connexion
from datetime import datetime
from dateutil.tz import tzlocal
from dsub.providers import google, local, stub
from flask import current_app, request
from oauth2client.client import AccessTokenCredentials, AccessTokenCredentialsError
from werkzeug.exceptions import BadRequest, Unauthorized, NotImplemented

from jobs.controllers import dsub_client, job_ids, job_statuses
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
    auth_token = _get_auth_token()
    project_id, job_id, task_id = job_ids.api_to_dsub(id, _provider_type())
    provider = _get_provider(project_id, auth_token)
    _client().abort_job(provider, job_id, task_id)


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
    auth_token = _get_auth_token()
    project_id, job_id, task_id = job_ids.api_to_dsub(id, _provider_type())
    provider = _get_provider(project_id, auth_token)
    job = _client().get_job(provider, job_id, task_id)

    return JobMetadataResponse(
        id=id,
        name=job['job-name'],
        status=job_statuses.dsub_to_api(job),
        submission=_parse_datetime(job['create-time']),
        start=_parse_datetime(job.get('start-time')),
        end=_parse_datetime(job['end-time']),
        inputs=job['inputs'],
        outputs=job['outputs'],
        labels=_job_to_api_labels(job),
        logs=_job_to_api_logs(job),
        failures=_get_failures(job))


def query_jobs(body):
    """
    Query jobs by various filter criteria.

    Args:
        body (dict): The JSON request body.

    Returns:
        QueryJobsResponse: Response containing results from query
    """
    auth_token = _get_auth_token()
    query = QueryJobsRequest.from_dict(body)
    if not query.page_size:
        query.page_size = _DEFAULT_PAGE_SIZE
    query.page_size = min(query.page_size, _MAX_PAGE_SIZE)
    provider = _get_provider(query.parent_id, auth_token)

    jobs, next_page_token = _client().query_jobs(provider, query)
    results = [_query_result(j, query.parent_id) for j in jobs]
    return QueryJobsResponse(results=results, next_page_token=next_page_token)


def _client():
    return current_app.config['CLIENT']


def _get_auth_token():
    auth_header = request.headers.get('Authentication')
    if auth_header:
        components = auth_header.split(' ')
        if len(components) == 2 and components[0] == 'Bearer':
            return components[1]

    return None


def _get_failures(job):
    if (job['status'] == job_statuses.DsubStatus.FAILURE
            and job['status-message'] and job['last-update']):
        return [
            FailureMessage(
                failure=job['status-message'], timestamp=job['last-update'])
        ]
    return None


def _get_google_provider(parent_id, auth_token):
    if not parent_id:
        raise BadRequest('Missing required field `parentId`.')
    if not auth_token:
        if _requires_auth():
            raise BadRequest('Missing required field `authToken`.')
        return google.GoogleJobProvider(False, False, parent_id)

    try:
        credentials = AccessTokenCredentials(auth_token, 'user-agent')
        return google.GoogleJobProvider(
            False, False, parent_id, credentials=credentials)
    except AccessTokenCredentialsError as e:
        raise Unauthorized('Invalid authentication token:{}.'.format(e))


def _get_provider(parent_id=None, auth_token=None):
    if _provider_type() == dsub_client.ProviderType.GOOGLE:
        return _get_google_provider(parent_id, auth_token)
    elif parent_id or auth_token:
        raise BadRequest(
            'The Local provider does not support the `{}` field .'.format(
                'authToken' if auth_token else 'parentId'))
    elif _provider_type() == dsub_client.ProviderType.LOCAL:
        return local.LocalJobProvider()
    elif _provider_type() == dsub_client.ProviderType.STUB:
        return stub.StubJobProvider()


def _job_to_api_labels(job):
    # Put any dsub specific information into the labels. These fields are
    # candidates for the common jobs API
    labels = job['labels'].copy() if job['labels'] else {}
    if 'status-detail' in job:
        labels['status-detail'] = job['status-detail']
    if 'last-update' in job:
        labels['last-update'] = job['last-update']
    if 'user-id' in job:
        labels['user-id'] = job['user-id']
    return labels


def _job_to_api_logs(job):
    if job['logging'] and job['logging'].endswith('.log'):
        base_log_path = job['logging'][:-4]
        return {
            'controller-log': '{}.log'.format(base_log_path),
            'stderr': '{}-stderr.log'.format(base_log_path),
            'stdout': '{}-stdout.log'.format(base_log_path),
        }
    return None


def _parse_datetime(date):
    return date if isinstance(date, datetime) else None


def _provider_type():
    return current_app.config['PROVIDER_TYPE']


def _requires_auth():
    return current_app.config['REQUIRES_AUTH']


def _query_result(job, project_id=None):
    return QueryJobsResult(
        id=job_ids.dsub_to_api(project_id, job['job-id'], job.get('task-id')),
        name=job['job-name'],
        status=job_statuses.dsub_to_api(job),
        submission=_parse_datetime(job['create-time']),
        start=_parse_datetime(job.get('start-time')),
        end=_parse_datetime(job['end-time']),
        labels=_job_to_api_labels(job))
