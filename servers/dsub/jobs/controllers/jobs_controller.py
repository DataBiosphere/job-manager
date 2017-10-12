import connexion
from flask import current_app
from werkzeug.exceptions import BadRequest
from datetime import datetime
from dateutil.tz import tzlocal
from dsub.providers import google
from dsub.providers import local
from dsub.providers import stub
from jobs.models.job_metadata_response import JobMetadataResponse
from jobs.models.query_jobs_request import QueryJobsRequest
from jobs.models.query_jobs_response import QueryJobsResponse
from jobs.models.query_jobs_result import QueryJobsResult
from dsub_client import ProviderType
import job_statuses
import job_ids


def provider_type():
    return current_app.config['PROVIDER_TYPE']


def client():
    return current_app.config['CLIENT']


def abort_job(id):
    """Abort a job by API Job ID.

    Args:
        id (str): Job ID to be aborted

    Returns: None
    """
    project_id, job_id, task_id = job_ids.api_to_dsub(id, provider_type())
    provider = _get_provider(project_id)
    task = client().abort_job(provider, job_id, task_id)


def get_job(id):
    """Get a job's metadata by API Job ID.

    Args:
        id (str): Job ID to get

    Returns:
        JobMetadataResponse: Response containing relevant metadata
    """
    project_id, job_id, task_id = job_ids.api_to_dsub(id, provider_type())
    provider = _get_provider(project_id)
    job = client().get_job(provider, job_id, task_id)
    submission, start, end = _parse_job_datetimes(job)

    return JobMetadataResponse(
        id=id,
        name=job.get('job-name'),
        status=job_statuses.dsub_to_api(job.get('status')),
        submission=submission,
        start=start,
        end=end,
        inputs=job.get('inputs', {}),
        outputs=_job_to_api_outputs(job),
        labels=_job_to_api_labels(job))


def query_jobs(body):
    """
    Query jobs by various filter criteria.

    Args:
        body (dict): The JSON request body.

    Returns:
        QueryJobsResponse: Response containing results from query
    """
    query = QueryJobsRequest.from_dict(body)
    jobs = client().query_jobs(_get_provider(query.parent_id), query)
    results = [_query_result(j, query.parent_id) for j in jobs]
    return QueryJobsResponse(results=results)


def _query_result(job, project_id=None):
    submission, start, end = _parse_job_datetimes(job)
    return QueryJobsResult(
        id=job_ids.dsub_to_api(project_id,
                               job.get('job-id'), job.get('task-id')),
        name=job.get('job-name'),
        status=job_statuses.dsub_to_api(job.get('status')),
        submission=submission,
        start=start,
        end=end,
        labels=_job_to_api_labels(job))


def _parse_job_datetimes(j):
    # TODO(https://github.com/googlegenomics/dsub/issues/77): remove NA check
    # TODO(https://github.com/googlegenomics/dsub/issues/74): Use 'start-time'
    # for start via dsub instead of create-time
    submission = _parse_datetime(
        j['create-time']) if 'create-time' in j else None
    start = _parse_datetime(j['create-time']) if 'create-time' in j else None
    end = _parse_datetime(
        j['end-time']) if 'end-time' in j and j['end-time'] != 'NA' else None
    return submission, start, end


def _parse_datetime(d):
    # TODO(https://github.com/googlegenomics/dsub/issues/77): remove conditional
    # parsing by provider and date type (dsub should always return a datetime
    # object in the python API). This format is specific to dsub
    # https://github.com/googlegenomics/dsub/blob/master/dsub/providers/google.py#L1324
    if (isinstance(d, datetime)):
        return d
    elif provider_type() == ProviderType.GOOGLE:
        return datetime.strptime(d, '%Y-%m-%d %H:%M:%S').replace(
            tzinfo=tzlocal())
    return datetime.strptime(d, '%Y-%m-%d %H:%M:%S.%f').replace(
        tzinfo=tzlocal())


def _job_to_api_labels(job):
    # Put any dsub specific information into the labels. These fields are
    # candidates for the common jobs API
    labels = job.get('labels', {}).copy()
    if 'status-detail' in job:
        labels['status-detail'] = job['status-detail']
    if 'last-update' in job:
        labels['last-update'] = job['last-update']
    if 'user-id' in job:
        labels['user-id'] = job['user-id']
    return labels


def _job_to_api_outputs(job):
    outputs = job.get('outputs', {}).copy()
    # https://cloud.google.com/genomics/v1alpha2/pipelines-api-troubleshooting#pipeline_operation_log_files
    # TODO(https://github.com/googlegenomics/dsub/issues/75): drop this
    # workaround once the pipelines API and dsub support returning all log files
    if 'logging' in job and job['logging'].endswith('.log'):
        base_log_path = job['logging'][:-4]
        outputs['log-controller'] = '{}.log'.format(base_log_path)
        outputs['log-stderr'] = '{}-stderr.log'.format(base_log_path)
        outputs['log-stdout'] = '{}-stdout.log'.format(base_log_path)
    return outputs


def _get_provider(parent_id=None):
    if provider_type() == ProviderType.GOOGLE:
        if not parent_id:
            raise BadRequest('missing required field parentId')
        return google.GoogleJobProvider(False, False, parent_id)
    elif provider_type() == ProviderType.LOCAL and not parent_id:
        return local.LocalJobProvider()
    elif provider_type() == ProviderType.STUB and not parent_id:
        return stub.StubJobProvider()
    else:
        raise BadRequest(
            'parentId can only be specified for the google dsub provider')
