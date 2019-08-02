import requests
from flask import current_app
from werkzeug.exceptions import BadRequest, Forbidden, InternalServerError, NotFound, ServiceUnavailable, Unauthorized
from datetime import datetime
from dateutil.tz import *
import dateutil.parser
import json
import logging
import pytz
import urllib

from jm_utils import page_tokens
from jobs.controllers.utils.auth import requires_auth
from jobs.models.extended_fields import ExtendedFields
from jobs.models.query_jobs_result import QueryJobsResult
from jobs.models.query_jobs_request import QueryJobsRequest
from jobs.models.query_jobs_response import QueryJobsResponse
from jobs.models.job_metadata_response import JobMetadataResponse
from jobs.models.task_metadata import TaskMetadata
from jobs.models.failure_message import FailureMessage
from jobs.models.shard import Shard
from jobs.models.update_job_labels_response import UpdateJobLabelsResponse
from jobs.models.update_job_labels_request import UpdateJobLabelsRequest
from jobs.models.health_response import HealthResponse
from jobs.models.execution_event import ExecutionEvent
from jobs.models.individual_attempt import IndividualAttempt
from jobs.models.job_attempts_response import JobAttemptsResponse
from jobs.models.job_operation_response import JobOperationResponse
from jobs.controllers.utils import job_statuses
from jobs.controllers.utils import task_statuses

_DEFAULT_PAGE_SIZE = 64

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger('{module_path}'.format(module_path=__name__))

attempt_include_keys = ('attempt', 'backendLogs:log', 'callCaching:hit',
                        'callRoot', 'end', 'executionStatus', 'failures',
                        'inputs', 'jobId', 'outputs', 'shardIndex', 'start',
                        'stderr', 'stdout')

job_include_keys = attempt_include_keys + (
    'calls', 'description', 'executionEvents', 'labels', 'parentWorkflowId',
    'returnCode', 'status', 'submission', 'subWorkflowId', 'workflowName')

offset_aware_now = datetime.utcnow().replace(tzinfo=pytz.utc)

@requires_auth
def abort_job(id, **kwargs):
    """
    Abort a job by ID

    :param id: Job ID
    :type id: str

    :rtype: None
    """
    url = '{cromwell_url}/{id}/abort'.format(cromwell_url=_get_base_url(),
                                             id=id)
    response = requests.post(url,
                             auth=kwargs.get('auth'),
                             headers=kwargs.get('auth_headers'))
    if response.status_code != 200:
        handle_error(response)


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
    url = '{cromwell_url}/{id}/labels'.format(cromwell_url=_get_base_url(),
                                              id=id)
    response = requests.patch(url,
                              json=payload,
                              auth=kwargs.get('auth'),
                              headers=kwargs.get('auth_headers'))

    if response.status_code != 200:
        handle_error(response)

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

    url = '{cromwell_url}/{id}/metadata?{query}'.format(
        cromwell_url=_get_base_url(),
        id=id,
        query='includeKey=' + '&includeKey='.join(job_include_keys))
    response = requests.get(url,
                            auth=kwargs.get('auth'),
                            headers=kwargs.get('auth_headers'))

    if response.status_code != 200:
        handle_error(response)

    job = response.json()

    failures = [
        format_task_failure(name, m)
        for name, metadata in job.get('calls', {}).items() for m in metadata
        if m.get('failures') is not None
    ]

    # if there are no tasks/subworkflows but there are errors, get them
    if not len(failures) and job.get('failures'):
        failures = [format_workflow_failure(f) for f in job.get('failures')]

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
        submission = start or offset_aware_now
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
        extensions=ExtendedFields(tasks=sorted_tasks,
                                  parent_job_id=job.get('parentWorkflowId')))


@requires_auth
def get_task_attempts(id, task, **kwargs):
    """
    Query for attempt metadata for a specified job task

    :param id: Job ID
    :type id: str

    :param task: Task Name
    :type task: str

    :rtype: JobAttemptsResponse
    """

    url = '{cromwell_url}/{id}/metadata?{query}'.format(
        cromwell_url=_get_base_url(),
        id=id,
        query='includeKey=' + '&includeKey='.join(attempt_include_keys))
    response = requests.get(url,
                            auth=kwargs.get('auth'),
                            headers=kwargs.get('auth_headers'))

    if response.status_code != 200:
        handle_error(response)

    job = response.json()

    attempts = [
        _convert_to_attempt(call) for call in job.get('calls').get(task)
    ]
    return JobAttemptsResponse(attempts=attempts)


@requires_auth
def get_shard_attempts(id, task, index, **kwargs):
    """
    Query for attempt metadata for a specified job task shard

    :param id: Job ID
    :type id: str

    :param task: Task Name
    :type task: str

    :param index: Shard Index
    :type index: str

    :rtype: JobAttemptsResponse
    """

    url = '{cromwell_url}/{id}/metadata?{query}'.format(
        cromwell_url=_get_base_url(),
        id=id,
        query='includeKey=' + '&includeKey='.join(attempt_include_keys))
    response = requests.get(url,
                            auth=kwargs.get('auth'),
                            headers=kwargs.get('auth_headers'))

    if response.status_code != 200:
        handle_error(response)

    job = response.json()

    attempts = [
        _convert_to_attempt(shard) for shard in job.get('calls').get(task)
        if (shard.get('shardIndex') == int(index))
    ]
    return JobAttemptsResponse(attempts=attempts)


def health(**kwargs):
    """
    Query for the health of the backend.

    Args:

    Returns:
        HealthResponse: Health of the service and its link to its backend.
    """

    status_url = _get_base_url().split("/api/")[0] + "/engine/v1/status"
    logger.debug("Using {} to query Cromwell status".format(status_url))

    try:
        response = requests.get(status_url,
                                auth=kwargs.get('auth'),
                                headers=kwargs.get('auth_headers'))

        if response.status_code != 200:
            logger.warning(
                "Got a non-200 status response from Cromwell status: {} ({})".
                format(response.status_code, response.text))
            raise ServiceUnavailable(HealthResponse(available=False))
        else:
            logger.info("Health check got a positive response from Cromwell!")
            return HealthResponse(available=True)
    except Exception:
        logger.warning("Failed to connect to Cromwell whatsoever")
        raise ServiceUnavailable(HealthResponse(available=False))


def format_task(task_name, task_metadata):
    # check to see if task is scattered
    if task_metadata[0].get('shardIndex') != -1:
        return format_scattered_task(task_name, task_metadata)
    latest_attempt = task_metadata[-1]

    call_cached = False
    if latest_attempt.get('callCaching'):
        call_cached = latest_attempt.get('callCaching') and (_is_call_cached(
            latest_attempt.get('callCaching')))

    execution_events = _get_execution_events(
        latest_attempt.get('executionEvents'))

    failure_messages = None
    if latest_attempt.get('failures'):
        failure_messages = [
            f.get('message') for f in latest_attempt.get('failures')
        ]

    return TaskMetadata(
        name=remove_workflow_name(task_name),
        execution_status=task_statuses.cromwell_execution_to_api(
            latest_attempt.get('executionStatus')),
        start=_parse_datetime(latest_attempt.get('start'))
        or _parse_datetime(latest_attempt.get('end')) or offset_aware_now,
        end=_parse_datetime(latest_attempt.get('end')),
        stderr=latest_attempt.get('stderr'),
        stdout=latest_attempt.get('stdout'),
        backend_log=latest_attempt.get('backendLogs').get('log')
        if latest_attempt.get('backendLogs') else None,
        inputs=update_key_names(latest_attempt.get('inputs', {})),
        outputs=update_key_names(latest_attempt.get('outputs', {})),
        return_code=latest_attempt.get('returnCode'),
        attempts=latest_attempt.get('attempt'),
        call_root=latest_attempt.get('callRoot'),
        operation_id=latest_attempt.get('jobId'),
        job_id=latest_attempt.get('subWorkflowId'),
        shards=None,
        call_cached=call_cached,
        execution_events=execution_events,
        failure_messages=failure_messages)


def format_task_failure(task_name, metadata):
    return FailureMessage(task_name=remove_workflow_name(task_name),
                          failure=get_deepest_message(
                              metadata.get('failures')),
                          timestamp=_parse_datetime(metadata.get('end')),
                          stdout=metadata.get('stdout'),
                          stderr=metadata.get('stderr'),
                          backend_log=metadata.get('backendLogs').get('log')
                          if metadata.get('backendLogs') else None,
                          call_root=metadata.get('callRoot'),
                          operation_id=metadata.get('jobId'),
                          job_id=metadata.get('subWorkflowId'))


def format_workflow_failure(failure):
    return FailureMessage('Workflow Error',
                          failure=format_workflow_failure_message(failure))


def format_workflow_failure_message(failure):
    caused_by_list = failure.get('causedBy')
    message = failure.get('message')
    total_errors = len(caused_by_list)
    for i in range(total_errors):
        message += ' (Caused by [reason {} of {}]: '.format(
            i + 1, total_errors)
        message += format_workflow_failure_message(caused_by_list[i])
        message += ')'
    return message


def format_scattered_task(task_name, task_metadata):
    filtered_shards = []
    current_shard = ''
    min_start = _parse_datetime(
        task_metadata[0].get('start')) or _parse_datetime(
            task_metadata[0].get('end')) or offset_aware_now
    max_end = _parse_datetime(task_metadata[-1].get('end'))

    # go through calls in reverse to grab the latest attempt if there are multiple
    for shard in task_metadata[::-1]:
        if current_shard != shard.get('shardIndex'):
            failure_messages = None
            if shard.get('failures'):
                failure_messages = [
                    f.get('message') for f in shard.get('failures')
                ]
            filtered_shards.append(
                Shard(execution_status=task_statuses.cromwell_execution_to_api(
                    shard.get('executionStatus')),
                      start=_parse_datetime(shard.get('start'))
                      or _parse_datetime(shard.get('end'))
                      or offset_aware_now,
                      end=_parse_datetime(shard.get('end')),
                      shard_index=shard.get('shardIndex'),
                      execution_events=_get_execution_events(
                          shard.get('executionEvents')),
                      stdout=shard.get('stdout'),
                      stderr=shard.get('stderr'),
                      backend_log=shard.get('backendLogs').get('log')
                      if shard.get('backendLogs') else None,
                      call_root=shard.get('callRoot'),
                      operation_id=shard.get('jobId'),
                      attempts=shard.get('attempt'),
                      failure_messages=failure_messages,
                      job_id=shard.get('subWorkflowId')))
            if shard.get('start') and min_start > _parse_datetime(shard.get('start')):
                min_start = _parse_datetime(shard.get('start'))
            if shard.get('executionStatus') not in ['Failed', 'Done']:
                max_end = None
            if max_end is not None and max_end < _parse_datetime(
                    shard.get('end')):
                max_end = _parse_datetime(shard.get('end'))
        current_shard = shard.get('shardIndex')

    sorted_shards = sorted(filtered_shards, key=lambda t: t.shard_index)

    return TaskMetadata(
        name=remove_workflow_name(task_name),
        execution_status=_get_scattered_task_status(sorted_shards),
        attempts=len(sorted_shards),
        start=min_start,
        end=max_end,
        call_root=remove_shard_path(task_metadata[-1].get('callRoot')),
        shards=sorted_shards,
        call_cached=False)


def remove_workflow_name(name):
    """ Remove the workflow name from the beginning of task, input and output names (if it's there).
    E.g. Task names {workflowName}.{taskName} => taskName
         Input names {workflowName}.{inputName} => inputName
         Output names {workflowName}.{taskName}.{outputName} => taskName.outputName
    """
    partitioned = name.partition('.')
    name = partitioned[2] if partitioned[2] != '' else partitioned[0]
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
    query.labels = _format_query_labels(query.labels)
    query_page_size = query.page_size or _DEFAULT_PAGE_SIZE
    offset = 0
    if query.page_token is not None:
        offset = page_tokens.decode_offset(query.page_token)
    page = page_from_offset(offset, query_page_size)

    has_auth = headers is not None

    response = requests.post(_get_base_url() + '/query',
                             json=cromwell_query_params(
                                 query, page, query_page_size, has_auth),
                             auth=auth,
                             headers=headers)

    if response.status_code != 200:
        handle_error(response)

    total_results = int(response.json()['totalResultsCount'])
    last_page = get_last_page(total_results, query_page_size)

    jobs_list = [
        format_job(job, offset_aware_now)
        for job in response.json()['results']
    ]
    if page >= last_page:
        return QueryJobsResponse(results=jobs_list, total_size=total_results)
    next_page_token = page_tokens.encode_offset(offset + query_page_size)
    return QueryJobsResponse(results=jobs_list,
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


def cromwell_query_params(query, page, page_size, has_auth):
    query_params = []
    if query.start:
        start = datetime.strftime(query.start, '%Y-%m-%dT%H:%M:%S.%fZ')
        query_params.append({'start': start})
    if query.end:
        end = datetime.strftime(query.end, '%Y-%m-%dT%H:%M:%S.%fZ')
        query_params.append({'end': end})
    if query.submission:
        submission = datetime.strftime(query.submission,
                                       '%Y-%m-%dT%H:%M:%S.%fZ')
        query_params.append({'submission': submission})
    if query.id:
        query_params.append({'id': query.id})
    if query.name:
        query_params.append({'name': query.name})
    if query.status:
        statuses = [{
            'status': job_statuses.api_workflow_status_to_cromwell(s)
        } for s in set(query.status)]
        query_params.extend(statuses)
    if query.labels:
        labels = [{'label': k + ':' + v} for k, v in query.labels.items()]
        query_params.extend(labels)

    query_params.append({'pageSize': str(page_size)})
    query_params.append({'page': str(page)})
    query_params.append({'additionalQueryResultFields': 'parentWorkflowId'})
    query_params.append({'additionalQueryResultFields': 'labels'})

    # If the query request is passing along an auth header, that means the API
    # is sending requests to a CromIAM, not a Cromwell.  CromIAM can't retrieve
    # subworkflows, so it's not necessary to the query (and slows things down
    # significantly)
    if not has_auth:
        query_params.append({'includeSubworkflows': 'false'})
    if query.extensions and query.extensions.hide_archived:
        query_params.append({'excludeLabelAnd': 'flag:archive'})
    return query_params


def format_job(job, now):
    start = _parse_datetime(job.get('start')) or now
    submission = _parse_datetime(job.get('submission'))
    if submission is None:
        # Submission is required by the common jobs API. Submission may be missing
        # for subworkflows in which case we fallback to the workflow start time
        # or, if not started, the current time. This fallback logic may be
        # removed if/when Cromwell changes behavior per https://github.com/broadinstitute/cromwell/issues/2968.
        submission = start
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


def handle_error(response):
    if response.status_code == BadRequest.code:
        raise BadRequest(_get_response_message(response))
    elif response.status_code == Forbidden.code:
        raise Forbidden(_get_response_message(response))
    elif response.status_code == InternalServerError.code:
        raise InternalServerError(_get_response_message(response))
    elif response.status_code == NotFound.code:
        raise NotFound(_get_response_message(response))
    elif response.status_code == ServiceUnavailable.code:
        raise ServiceUnavailable(_get_response_message(response))
    elif response.status_code == Unauthorized.code:
        raise Unauthorized(_get_response_message(response))

    response.raise_for_status()


@requires_auth
def get_operation_details(job, operation, **kwargs):
    """
    Query for operation details from Google Pipelines API

    :param job: Job ID
    :type id: str

    :param operation_id: Operation ID
    :type id: str

    :rtype: str
    """

    capabilities = current_app.config['capabilities']
    if hasattr(capabilities, 'authentication') and hasattr(
            capabilities.authentication,
            'outside_auth') and capabilities.authentication.outside_auth:
        url = '{cromwell_url}/{id}/backend/metadata/{backendId}'.format(
            cromwell_url=_get_base_url(), id=job, backendId=operation)
        response = requests.get(url,
                                auth=kwargs.get('auth'),
                                headers=kwargs.get('auth_headers'))

    if response.status_code != 200:
        handle_error(response)

    return JobOperationResponse(id=job, details=response.text)


def _get_execution_events(events):
    execution_events = None
    if events:
        execution_events = [
            ExecutionEvent(name=event.get('description'),
                           start=_parse_datetime(event.get('startTime')),
                           end=_parse_datetime(event.get('endTime')))
            for event in events
        ]
    return execution_events


def get_deepest_message(metadata_list):
    if 'causedBy' in metadata_list[0] and len(
            metadata_list[0].get('causedBy')):
        return get_deepest_message(metadata_list[0].get('causedBy'))
    else:
        return metadata_list[0].get('message')


def _parse_datetime(date_string):
    if not date_string:
        return None
    try:
        formatted_date = dateutil.parser.parse(date_string).astimezone(tzutc())
    except ValueError:
        return None
    return formatted_date


def _get_base_url():
    return current_app.config['cromwell_url']


def _format_query_labels(orig_query_labels):
    if orig_query_labels is None:
        return None
    query_labels = {}
    for key, val in orig_query_labels.items():
        query_labels[urllib.unquote(key)] = urllib.unquote(val)
    return query_labels


def _get_scattered_task_status(shards):
    # get all shard statuses
    statuses = {
        shard.execution_status
        for shard in shards if hasattr(shard, 'execution_status')
    }
    # return status by ranked applicability
    for status in [
            'Failed', 'Aborting', 'Aborted', 'Running', 'Submitted',
            'Succeeded'
    ]:
        if status in statuses:
            return status


def _convert_to_attempt(item):
    attempt = IndividualAttempt(
        execution_status=task_statuses.cromwell_execution_to_api(
            item.get('executionStatus')),
        attempt_number=item.get('attempt'),
        call_cached=_is_call_cached(item.get('callCaching')),
        stdout=item.get('stdout'),
        stderr=item.get('stderr'),
        backend_log=item.get('backendLogs').get('log')
        if item.get('backendLogs') else None,
        call_root=item.get('callRoot'),
        operation_id=item.get('jobId'),
        inputs=item.get('inputs'),
        outputs=item.get('outputs'),
        start=_parse_datetime(item.get('start'))
        or _parse_datetime(item.get('end')) or offset_aware_now,
        end=_parse_datetime(item.get('end')) or offset_aware_now)

    if item.get('failures'):
        attempt.failure_messages = [
            f.get('message') for f in item.get('failures')
        ]

    return attempt


def _is_call_cached(metadata):
    if metadata is not None:
        hit = metadata.get('hit')
        if hit is not None:
            return hit
    return False


def _get_response_message(response):
    if is_jsonable(response) and response.json().get('message'):
        return response.json().get('message')
    return str(response)


def is_jsonable(x):
    try:
        x.json()
        return True
    except:
        return False
