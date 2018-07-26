import requests
from flask import current_app
from werkzeug.exceptions import BadRequest, NotFound, InternalServerError
from datetime import datetime

from jm_utils import page_tokens
from jobs.controllers.utils.auth import requires_auth
from jobs.models.extended_fields import ExtendedFields
from jobs.models.query_jobs_result import QueryJobsResult
from jobs.models.query_jobs_request import QueryJobsRequest
from jobs.models.query_jobs_response import QueryJobsResponse
from jobs.models.job_metadata_response import JobMetadataResponse
from jobs.models.task_metadata import TaskMetadata
from jobs.models.failure_message import FailureMessage
from jobs.models.shard_status_count import ShardStatusCount
from jobs.models.update_job_labels_response import UpdateJobLabelsResponse
from jobs.models.update_job_labels_request import UpdateJobLabelsRequest
from jobs.controllers.utils import job_statuses
from jobs.controllers.utils import task_statuses

_DEFAULT_PAGE_SIZE = 64


@requires_auth
def abort_job(id, **kwargs):
    """
    Abort a job by ID

    :param id: Job ID
    :type id: str

    :rtype: None
    """
    url = '{cromwell_url}/{id}/abort'.format(
        cromwell_url=_get_base_url(), id=id)
    response = requests.post(
        url, auth=kwargs.get('auth'), headers=kwargs.get('auth_headers'))
    if response.status_code == NotFound.code:
        raise NotFound(response.json()['message'])


@requires_auth
def update_job_labels(id, body, **kwargs):
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
    response = requests.patch(
        url,
        json=payload,
        auth=kwargs.get('auth'),
        headers=kwargs.get('auth_headers'))

    if response.status_code == InternalServerError.code:
        raise InternalServerError(response.json().get('message'))
    elif response.status_code == BadRequest.code:
        raise BadRequest(response.json().get('message'))
    elif response.status_code == NotFound.code:
        raise NotFound(response.json().get('message'))
    response.raise_for_status()

    # Follow API spec
    result = response.json()
    return UpdateJobLabelsResponse(labels=result.get('labels'))


@requires_auth
def get_job(id, **kwargs):
    """
    Query for job and task-level metadata for a specified job

    :param id: Job ID
    :type id: str

    :rtype: JobMetadataResponse
    """
    url = '{cromwell_url}/{id}/metadata'.format(
        cromwell_url=_get_base_url(), id=id)
    response = requests.get(
        url, auth=kwargs.get('auth'), headers=kwargs.get('auth_headers'))
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

    tasks = [
        format_task(task_name, task_metadata)
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
        status=job_statuses.cromwell_workflow_status_to_api(job.get('status')),
        submission=submission,
        start=start,
        end=_parse_datetime(job.get('end')),
        inputs=update_key_names(job.get('inputs', {})),
        outputs=update_key_names(job.get('outputs', {})),
        labels=job.get('labels'),
        failures=failures,
        extensions=ExtendedFields(tasks=sorted_tasks))


def format_task(task_name, task_metadata):
    # check to see if task is scattered
    if task_metadata[-1].get('shardIndex') != -1:
        return format_scattered_task(task_name, task_metadata)
    latest_attempt = task_metadata[-1]
    return TaskMetadata(
        name=remove_workflow_name(task_name),
        execution_id=latest_attempt.get('jobId'),
        execution_status=task_statuses.cromwell_execution_to_api(
            latest_attempt.get('executionStatus')),
        start=_parse_datetime(latest_attempt.get('start')),
        end=_parse_datetime(latest_attempt.get('end')),
        stderr=latest_attempt.get('stderr'),
        stdout=latest_attempt.get('stdout'),
        inputs=update_key_names(latest_attempt.get('inputs', {})),
        return_code=latest_attempt.get('returnCode'),
        attempts=latest_attempt.get('attempt'),
        call_root=latest_attempt.get('callRoot'),
        job_id=latest_attempt.get('subWorkflowId'),
        shard_statuses=None)


def format_scattered_task(task_name, task_metadata):
    temp_status_collection = {}
    current_shard = ''
    minStart = _parse_datetime(task_metadata[0].get('start'))
    maxEnd = _parse_datetime(task_metadata[0].get('end'))

    # go through calls in reverse to grab the latest attempt if there are multiple
    # get earliest start time and latest end time
    for shard in task_metadata[::-1]:
        if current_shard != shard.get('shardIndex'):
            status = task_statuses.cromwell_execution_to_api(
                shard.get('executionStatus'))
            if status not in temp_status_collection:
                temp_status_collection[status] = 1
            else:
                temp_status_collection[
                    status] = temp_status_collection[status] + 1
        if minStart > _parse_datetime(shard.get('start')):
            minStart = _parse_datetime(shard.get('start'))
        if shard.get('executionStatus') not in ['Failed','Done']:
            maxEnd = None
        if maxEnd is not None and maxEnd < _parse_datetime(shard.get('end')):
            maxEnd = _parse_datetime(shard.get('end'))
        current_shard = shard.get('shardIndex')

    shard_status_counts = [
        ShardStatusCount(status=status, count=temp_status_collection[status])
        for status in temp_status_collection
    ]

    # grab attempts, path and subWorkflowId from last call
    return TaskMetadata(
        name=remove_workflow_name(task_name),
        execution_status=task_statuses.cromwell_execution_to_api(
            task_metadata[-1].get('executionStatus')),
        start=minStart,
        end=maxEnd,
        attempts=task_metadata[-1].get('attempt'),
        call_root=remove_shard_path(task_metadata[-1].get('callRoot')),
        job_id=task_metadata[-1].get('subWorkflowId'),
        shard_statuses=shard_status_counts)


def remove_workflow_name(name):
    """ Remove the workflow name from the beginning of task, input and output names (if it's there).
    E.g. Task names {workflowName}.{taskName} => taskName
         Input names {workflowName}.{inputName} => inputName
         Output names {workflowName}.{taskName}.{outputName} => taskName.outputName
    """
    if "." in name:
        return '.'.join(name.split('.')[1:])
    return name


def remove_shard_path(path):
    """ Remove the workflow name from the beginning of task, input and output names (if it's there).
    E.g. Task names {..}/{taskName}/shard-0 => {..}/{taskName}/
     """
    if not path:
        return None
    if "/shard-" in path:
        return path.split('/shard-')[0]
    return path


def update_key_names(metadata):
    return {remove_workflow_name(k): v for k, v in metadata.items()}


@requires_auth
def query_jobs(body, **kwargs):
    """
    Query jobs by various filter criteria. Additional jobs are requested if the number of results is less than the
    requested page size. The returned jobs are ordered from newest to oldest submission time.

    :param body:
    :type body: dict | bytes

    :rtype: QueryJobsResponse
    """
    auth = kwargs.get('auth')
    headers = kwargs.get('auth_headers')
    query = QueryJobsRequest.from_dict(body)
    query_page_size = query.page_size or _DEFAULT_PAGE_SIZE
    offset = 0
    if query.page_token is not None:
        offset = page_tokens.decode_offset(query.page_token)
    page = page_from_offset(offset, query_page_size)

    response = requests.post(
        _get_base_url() + '/query',
        json=cromwell_query_params(query, page, query_page_size),
        auth=auth,
        headers=headers)

    if response.status_code == BadRequest.code:
        raise BadRequest(response.json().get('message'))
    elif response.status_code == InternalServerError.code:
        raise InternalServerError(response.json().get('message'))
    response.raise_for_status()

    total_results = int(response.json()['totalResultsCount'])
    last_page = get_last_page(total_results, query_page_size)

    now = datetime.utcnow()
    jobs_list = [format_job(job, now) for job in response.json()['results']]
    if page >= last_page:
        return QueryJobsResponse(results=jobs_list, total_size=total_results)
    next_page_token = page_tokens.encode_offset(offset + query_page_size)
    return QueryJobsResponse(
        results=jobs_list,
        total_size=total_results,
        next_page_token=next_page_token)


def get_last_page(total_results, page_size):
    if total_results == 0:
        return 1
    elif total_results % page_size != 0:
        return total_results / page_size + 1
    return total_results / page_size


def page_from_offset(offset, page_size):
    if offset == 0:
        return 1
    return 1 + (offset / page_size)


def cromwell_query_params(query, page, page_size):
    query_params = []
    if query.start:
        start = datetime.strftime(query.start, '%Y-%m-%dT%H:%M:%S.%fZ')
        query_params.append({'start': start})
    if query.end:
        end = datetime.strftime(query.end, '%Y-%m-%dT%H:%M:%S.%fZ')
        query_params.append({'end': end})
    if query.name:
        query_params.append({'name': query.name})
    if query.statuses:
        statuses = [{
            'status': job_statuses.api_workflow_status_to_cromwell(s)
        } for s in set(query.statuses)]
        query_params.extend(statuses)
    if query.labels:
        labels = [{'label': k + ':' + v} for k, v in query.labels.items()]
        query_params.extend(labels)

    query_params.append({'pageSize': str(page_size)})
    query_params.append({'page': str(page)})
    query_params.append({'additionalQueryResultFields': 'parentWorkflowId'})
    query_params.append({'additionalQueryResultFields': 'labels'})
    query_params.append({'includeSubworkflows': 'false'})
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
        status=job_statuses.cromwell_workflow_status_to_api(job.get('status')),
        submission=submission,
        start=start,
        end=end,
        labels=job.get('labels'),
        extensions=ExtendedFields(parent_job_id=job.get('parentWorkflowId')))


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
