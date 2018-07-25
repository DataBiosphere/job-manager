import apiclient
import requests

from flask import current_app, request
from jobs.controllers.utils import jobs_generator, time_frame, providers
from jobs.models.aggregation import Aggregation
from jobs.models.aggregation_entry import AggregationEntry
from jobs.models.aggregation_response import AggregationResponse
from jobs.models.status_count import StatusCount
from jobs.models.status_counts import StatusCounts
from werkzeug.exceptions import BadRequest, NotFound, Forbidden, InternalServerError

_NUM_TOP_LABEL = 3
_LABEL_MIN_COUNT_FOR_RANK = 10


def get_job_aggregations(timeFrame, projectId=None):
    """Query for aggregated jobs in the given time frame.

    Args:
        timeFrame (str): Time Frame to aggregate over
        param projectId (str): The ID of the project to query

    Returns:
        AggregationResponse: Response contains aggregation of jobs
    """
    window_min = time_frame.time_frame_to_start_time(timeFrame)
    provider = providers.get_provider(_provider_type(), projectId,
                                      _auth_token())

    jobs = jobs_generator.generate_jobs_by_window(provider, projectId,
                                                  window_min)

    total_summary = {}
    user_summary = {}
    job_name_summary = {}
    label_summaries = {}

    num = 0
    # is_testing = False
    
    try:
        for job in jobs:
            
            # AGGREGATION_FILTER_LABEL is a global config parameter only set for aggregation testing
            # and jobs that do not have this label are discarded when testing
            # if 'TEST_TOKEN_VALUE' in current_app.config:
            #     print('filter name=', current_app.config['TEST_TOKEN_VALUE'])
            #     print('job labels', job.labels)
            #     print(type(job.labels))
            #     print('test_token' in job.labels)
            #     if 'test_token' in job.labels:
            #         print(job.labels['test_token'] is current_app.config['TEST_TOKEN_VALUE'])
            #         print(job.labels['test_token'] == current_app.config['TEST_TOKEN_VALUE'])

            # print(job)
            if 'TEST_TOKEN_VALUE' in current_app.config and ('test_token' not in job.labels or job.labels['test_token'] != current_app.config['TEST_TOKEN_VALUE']):
                # print('continue')
                continue

            if 'AGGREGATION_JOB_NAME_FILTER' in current_app.config and job.name != current_app.config['AGGREGATION_JOB_NAME_FILTER']:
                continue
            # if not is_testing and 'test_token' in job.labels:
            #     is_testing = True

            # if is_testing and 'test_token' not in job.labels:
            #     continue

            num += 1
            _count_total_summary(job, total_summary)
            _count_for_key(job, user_summary, job.extensions.user_id)
            _count_for_key(job, job_name_summary, job.name)
            _count_top_labels(job, label_summaries)
    except apiclient.errors.HttpError as error:
        _handle_http_error(error, projectId)

    print('jobs num: ', num)

    aggregations = [
        _to_aggregation('User Id', 'userId', user_summary),
        _to_aggregation('Job Name', 'name', job_name_summary)
    ] + _to_top_labels_aggregations(label_summaries)

    return AggregationResponse(
        summary=_to_summary_counts(total_summary), aggregations=aggregations)


def _count_total_summary(job, total_summary):
    if job.status not in total_summary:
        total_summary[job.status] = 0
    total_summary[job.status] += 1


def _count_for_key(job, summary, key):
    count = summary.get(key, {})

    if job.status not in count:
        count[job.status] = 0
    count[job.status] += 1

    summary[key] = count


def _count_top_labels(job, label_summaries):
    for label in job.labels:
        label_summary = label_summaries.get(label, {})
        _count_for_key(job, label_summary, job.labels[label])
        label_summaries[label] = label_summary


def _to_summary_counts(summary_counts):
    return StatusCounts([
        StatusCount(status, count) for status, count in summary_counts.items()
    ])


def _to_aggregation(name, key, summary):
    entries = []

    for item, counts_dict in summary.items():
        counts_list = []

        for status, count in counts_dict.items():
            counts_list.append(StatusCount(status=status, count=count))

        entries.append(
            AggregationEntry(
                label=item, status_counts=StatusCounts(counts_list)))

    return Aggregation(name=name, key=key, entries=entries)


def _to_top_labels_aggregations(label_summaries):
    # Rank the label summaries by the sum of valid item,
    # where valid means a label has jobs more than _LABEL_MIN_COUNT_FOR_RANK.
    label_freq = {}
    for label, item in label_summaries.items():
        # Do not use the job-id or task-id label as aggregation key
        if label == 'job-id' or label == 'task-id':
            continue
        total_count = 0
        for _, counts in item.items():
            total_count += sum(
                v for v in counts.values() if v > _LABEL_MIN_COUNT_FOR_RANK)
        label_freq[label] = total_count

    aggregations = []
    num_label = min(len(label_freq), _NUM_TOP_LABEL)

    for k, _ in sorted(
            label_freq.items(), key=lambda x: x[1], reverse=True)[0:num_label]:
        aggregations.append(_to_aggregation(k, k, label_summaries[k]))

    return aggregations


def _auth_token():
    auth_header = request.headers.get('Authentication')
    if auth_header:
        components = auth_header.split(' ')
        if len(components) == 2 and components[0] == 'Bearer':
            return components[1]
    return None


def _provider_type():
    return current_app.config['PROVIDER_TYPE']


def _handle_http_error(error, proj_id):
    # TODO(https://github.com/googlegenomics/dsub/issues/79): Push this
    # provider-specific error translation down into dstat.
    if error.resp.status == requests.codes.not_found:
        raise NotFound('Project "{}" not found'.format(proj_id))
    elif error.resp.status == requests.codes.forbidden:
        raise Forbidden('Permission denied for project "{}"'.format(proj_id))
    raise InternalServerError("Unexpected failure getting dsub jobs")
