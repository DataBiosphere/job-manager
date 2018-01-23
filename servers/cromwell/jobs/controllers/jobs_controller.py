import requests
from requests.auth import HTTPBasicAuth
from flask import current_app
from werkzeug.exceptions import BadRequest, NotFound, InternalServerError
from datetime import datetime

from jm_utils import page_tokens
from jobs.models.query_jobs_result import QueryJobsResult
from jobs.models.query_jobs_request import QueryJobsRequest
from jobs.models.query_jobs_response import QueryJobsResponse
from jobs.models.job_metadata_response import JobMetadataResponse
from jobs.models.task_metadata import TaskMetadata
from jobs.models.failure_message import FailureMessage
from jobs.models.update_job_labels_response import UpdateJobLabelsResponse
from jobs.models.update_job_labels_request import UpdateJobLabelsRequest

CROMWELL_DONE_STATUS = 'Done'
API_SUCCESS_STATUS = 'Succeeded'
_DEFAULT_PAGE_SIZE = 64


def abort_job(id):
    """
    Abort a job by ID

    :param id: Job ID
    :type id: str

    :rtype: None
    """
    url = '{cromwell_url}/{id}/abort'.format(
        cromwell_url=_get_base_url(), id=id)
    response = requests.post(url, auth=_get_user_auth())
    if response.status_code == NotFound.code:
        raise NotFound(response.json()['message'])


def update_job_labels(id, body):
    """
    Update labels on a job.

    :param id: Job ID
    :type id: str
    :param body:
    :type body: dict | bytes

    :rtype: UpdateJobLabelsResponse
    """
    payload = UpdateJobLabelsRequest.from_dict(body).labels
    url = '{cromwell_url}/{id}/labels'.format(
        cromwell_url=_get_base_url(), id=id)
    response = requests.patch(url, json=payload, auth=_get_user_auth())

    if response.status_code == InternalServerError.code:
        raise InternalServerError(response.json().get('message'))
    elif response.status_code == BadRequest.code:
        raise BadRequest(response.json().get('message'))
    elif response.status_code == NotFound.code:
        raise NotFound(response.json().get('message'))
    response.raise_for_status()

    # Follow API spec
    result = response.json()
    all_labels = get_job(id).labels
    if not all_labels:
        all_labels = {}

    # Redundantly update all_labels with updated labels to provide consistency guarantees
    all_labels.update(result.get('labels'))
    return UpdateJobLabelsResponse(labels=all_labels)


def get_job(id):
    """
    Query for job and task-level metadata for a specified job

    :param id: Job ID
    :type id: str

    :rtype: JobMetadataResponse
    """
    url = '{cromwell_url}/{id}/metadata'.format(
        cromwell_url=_get_base_url(), id=id)
    response = requests.get(url, auth=_get_user_auth())
    job = response.json()
    if response.status_code == BadRequest.code:
        raise BadRequest(job.get('message'))
    elif response.status_code == NotFound.code:
        raise NotFound(job.get('message'))
    elif response.status_code == InternalServerError.code:
        raise InternalServerError(job.get('message'))

    failures = None
    if job.get('failures'):
        failures = [
            FailureMessage(failure=f['message']) for f in job['failures']
        ]
    # Get the most recent run of each task in task_metadata
    tasks = [
        format_task(task_name, task_metadata[-1])
        for task_name, task_metadata in job.get('calls', {}).items()
    ]
    sorted_tasks = sorted(tasks, key=lambda t: t.start)
    start = _parse_datetime(job.get('start'))
    submission = _parse_datetime(job.get('submission'))
    if submission is None:
        # Submission is required by the common jobs API. Submission may be missing
        # for subworkflows in which case we fallback to the workflow start time
        # or, if not started, the current time. This fallback logic may be
        # removed if/when Cromwell changes behavior per https://github.com/broadinstitute/cromwell/issues/2968.
        submission = start or datetime.utcnow()
    return JobMetadataResponse(
        id=id,
        name=job.get('workflowName'),
        status=job.get('status'),
        submission=submission,
        start=start,
        end=_parse_datetime(job.get('end')),
        inputs=update_key_names(job.get('inputs', {})),
        outputs=update_key_names(job.get('outputs', {})),
        labels=job.get('labels'),
        failures=failures,
        tasks=sorted_tasks)


def format_task(task_name, task_metadata):
    return TaskMetadata(
        name=remove_workflow_name(task_name),
        execution_id=task_metadata.get('jobId'),
        execution_status=cromwell_to_api_status(
            task_metadata.get('executionStatus')),
        start=_parse_datetime(task_metadata.get('start')),
        end=_parse_datetime(task_metadata.get('end')),
        stderr=task_metadata.get('stderr'),
        stdout=task_metadata.get('stdout'),
        inputs=update_key_names(task_metadata.get('inputs', {})),
        return_code=task_metadata.get('returnCode'),
        attempts=task_metadata.get('attempt'),
        job_id=task_metadata.get('subWorkflowId'))


def cromwell_to_api_status(status):
    """ Use the API status 'Succeeded' instead of 'Done' for completed cromwell tasks. """
    if status == CROMWELL_DONE_STATUS:
        return API_SUCCESS_STATUS
    return status


def remove_workflow_name(name):
    """ Remove the workflow name from the beginning of task, input and output names.
    E.g. Task names {workflowName}.{taskName} => taskName
         Input names {workflowName}.{inputName} => inputName
         Output names {workflowName}.{taskName}.{outputName} => taskName.outputName
    """
    return '.'.join(name.split('.')[1:])


def update_key_names(metadata):
    return {remove_workflow_name(k): v for k, v in metadata.items()}


def query_jobs(body):
    """
    Query jobs by various filter criteria. Returned jobs are ordered from newest to oldest submission time.

    :param body:
    :type body: dict | bytes

    :rtype: QueryJobsResponse
    """
    query = QueryJobsRequest.from_dict(body)

    page_size = query.page_size or _DEFAULT_PAGE_SIZE
    offset = page_tokens.decode_offset(query.page_token) or 0
    page = page_from_offset(offset, page_size)
    params_for_cromwell = cromwell_query_params(query, page, page_size)

    response = requests.post(
        _get_base_url() + '/query',
        json=params_for_cromwell,
        auth=_get_user_auth())

    if response.status_code == BadRequest.code:
        raise BadRequest(response.json().get('message'))
    elif response.status_code == InternalServerError.code:
        raise InternalServerError(response.json().get('message'))
    response.raise_for_status()

    # Only list parent jobs
    now = datetime.utcnow()
    results = [
        format_job(job, now) for job in response.json()['results']
        if not job.get('parentWorkflowId')
    ]
    # Reverse so that newest jobs are listed first
    results.reverse()

    next_offset = offset + page_size
    next_page_token = page_tokens.encode_offset(next_offset)

    return QueryJobsResponse(results=results, next_page_token=next_page_token)


def page_from_offset(offset, page_size):
    return 1 + offset / page_size


def cromwell_query_params(query, page, page_size):
    query_params = []
    if query.start:
        query_params.append({'start': query.start})
    if query.end:
        query_params.append({'end': query.end})
    if query.name:
        query_params.append({'name': query.name})
    if query.statuses:
        statuses = [{'status': s} for s in set(query.statuses)]
        query_params.extend(statuses)
    query_params.append({'pageSize': str(page_size)})
    query_params.append({'page': str(page)})
    query_params.append({'additionalQueryResultFields': 'parentWorkflowId'})
    return query_params


def format_job(job, now):
    start = _parse_datetime(job.get('start'))
    submission = start
    if submission is None:
        # Submission is required by the common jobs API. Submission is not
        # currently returned via Cromwell QueryJobs, so start is used as a
        # stand-in value. If the job hasn't actually started yet, fake the
        # submission time as 'now' rather than returning null. Switch to true
        # submission time if/when supported by Cromwell: https://github.com/broadinstitute/cromwell/issues/3167.
        submission = now
    end = _parse_datetime(job.get('end'))
    return QueryJobsResult(
        id=job.get('id'),
        name=job.get('name'),
        status=job.get('status'),
        submission=submission,
        start=start,
        end=end,
        parent_job_id=job.get('parentWorkflowId'))


def _parse_datetime(date_string):
    # Handles issue where some dates in cromwell do not contain milliseconds
    # https://github.com/broadinstitute/cromwell/issues/2743
    if not date_string:
        return None
    try:
        formatted_date = datetime.strptime(date_string,
                                           '%Y-%m-%dT%H:%M:%S.%fZ')
    except ValueError:
        try:
            formatted_date = datetime.strptime(date_string,
                                               '%Y-%m-%dT%H:%M:%SZ')
        except ValueError:
            return None
    return formatted_date


def _get_base_url():
    return current_app.config['cromwell_url']


def _get_user_auth():
    return HTTPBasicAuth(current_app.config['cromwell_user'],
                         current_app.config['cromwell_password'])
