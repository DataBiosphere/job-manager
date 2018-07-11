from flask import current_app, request
from jobs.controllers.utils import jobs_generator, time_frame, providers
from jobs.models.aggregation import Aggregation
from jobs.models.aggregation_entry import AggregationEntry
from jobs.models.aggregation_response import AggregationResponse
from jobs.models.status_count import StatusCount
from jobs.models.status_counts import StatusCounts

_NUM_TOP_LABEL = 3
_LABEL_VALID_MIN = 10


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

    for job in jobs:
        _count_total_summary(job, total_summary)
        _count_for_key(job, user_summary, job.extensions.user_id)
        _count_for_key(job, job_name_summary, job.name)
        _count_top_labels(job, label_summaries)

    aggregations = [
        _to_aggregation('User Id', 'userId', user_summary),
        _to_aggregation('Job Name', 'name', job_name_summary)
    ] + (_to_top_labels_aggregations(label_summaries))

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
    # where valid means a label has jobs more than _LABEL_VALID_MIN.
    label_freq = {}
    for label, item in label_summaries.items():
        total_count = 0
        for label_value, counts in item.items():
            total_count += sum(
                v for _, v in counts.items() if v > _LABEL_VALID_MIN)
        label_freq[label] = total_count

    aggregations = []

    # To avoid messy look of dashboard, instead of returning all the aggregations by label,
    # we only return the top _NUM_TOP_LABEL result.
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
