import connexion
from datetime import datetime
from dateutil.tz import tzlocal
from dsub.providers import google, local, stub
from flask import current_app, request
from oauth2client.client import AccessTokenCredentials, AccessTokenCredentialsError
from werkzeug.exceptions import BadRequest, Unauthorized

from dsub_client import ProviderType
from jobs.models.failure_message import FailureMessage
from jobs.models.job_metadata_response import JobMetadataResponse
from jobs.models.query_jobs_response import QueryJobsResponse
from jobs.models.query_jobs_request import QueryJobsRequest
from jobs.models.query_jobs_result import QueryJobsResult
import job_statuses
import job_ids

_DEFAULT_PAGE_SIZE = 64
_MAX_PAGE_SIZE = 64


def abort_job(id):
    """Abort a job by API Job ID.

    Args:
        id (str): Job ID to be aborted

    Returns: None
    """
    auth_token = request.headers.get('authToken')
    project_id, job_id, task_id = job_ids.api_to_dsub(id, _provider_type())
    provider = _get_provider(project_id, auth_token)
    _client().abort_job(provider, job_id, task_id)


def get_job(id):
    """Get a job's metadata by API Job ID.

    Args:
        id (str): Job ID to get

    Returns:
        JobMetadataResponse: Response containing relevant metadata
    """
    auth_token = request.headers.get('authToken')
    project_id, job_id, task_id = job_ids.api_to_dsub(id, _provider_type())
    provider = _get_provider(project_id, auth_token)
    job = _client().get_job(provider, job_id, task_id)

    return JobMetadataResponse(
        id=id,
        name=job['job-name'],
        status=job_statuses.dsub_to_api(job['status']),
        submission=_parse_datetime(job['create-time']),
        # TODO(https://github.com/googlegenomics/dsub/issues/90) use start-time
        start=_parse_datetime(job['create-time']),
        end=_parse_datetime(job['end-time']),
        inputs=job['inputs'],
        outputs=_job_to_api_outputs(job),
        labels=_job_to_api_labels(job),
        failures=_get_failures(job))


def query_jobs(body):
    """
    Query jobs by various filter criteria.

    Args:
        body (dict): The JSON request body.

    Returns:
        QueryJobsResponse: Response containing results from query
    """
    auth_token = request.headers.get('authToken')
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
        raise BadRequest('missing required field parentId')
    if not auth_token:
        raise BadRequest('missing required field authToken')
    try:
        credentials = AccessTokenCredentials(auth_token, 'user-agent')
        return google.GoogleJobProvider(
            False, False, parent_id, credentials=credentials)
    except AccessTokenCredentialsError as e:
        raise Unauthorized('invalid authentication token:{}'.format(e))


def _get_provider(parent_id=None, auth_token=None):
    if _provider_type() == ProviderType.GOOGLE:
        return _get_google_provider(parent_id, auth_token)
    elif parent_id or auth_token:
        raise BadRequest('{} can only be specified for dsub Google provider'.
                         format('authToken' if auth_token else 'parentId'))
    elif _provider_type() == ProviderType.LOCAL:
        return local.LocalJobProvider()
    elif _provider_type() == ProviderType.STUB:
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


def _job_to_api_outputs(job):
    outputs = job['outputs'].copy() if job['outputs'] else {}
    # https://cloud.google.com/genomics/v1alpha2/pipelines-api-troubleshooting#pipeline_operation_log_files
    # TODO(https://github.com/googlegenomics/dsub/issues/75): drop this
    # workaround once the pipelines API and dsub support returning all log files
    if job['logging'] and job['logging'].endswith('.log'):
        base_log_path = job['logging'][:-4]
        outputs['log-controller'] = '{}.log'.format(base_log_path)
        outputs['log-stderr'] = '{}-stderr.log'.format(base_log_path)
        outputs['log-stdout'] = '{}-stdout.log'.format(base_log_path)
    return outputs


def _parse_datetime(date):
    return date if isinstance(date, datetime) else None


def _provider_type():
    return current_app.config['PROVIDER_TYPE']


def _query_result(job, project_id=None):
    return QueryJobsResult(
        id=job_ids.dsub_to_api(project_id, job['job-id'], job.get('task-id')),
        name=job['job-name'],
        status=job_statuses.dsub_to_api(job['status']),
        submission=_parse_datetime(job['create-time']),
        # TODO(https://github.com/googlegenomics/dsub/issues/90) use start-time
        start=_parse_datetime(job['create-time']),
        end=_parse_datetime(job['end-time']),
        labels=_job_to_api_labels(job))
