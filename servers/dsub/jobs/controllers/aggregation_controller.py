from flask import current_app, request
from jobs.controllers.utils import jobs_generator, time_frame, providers
from jobs.models.aggregation import Aggregation
from jobs.models.aggregation_entry import AggregationEntry
from jobs.models.aggregation_response import AggregationResponse
from jobs.models.status_count import StatusCount
from jobs.models.status_counts import StatusCounts


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

    for job in jobs:
        _count_total_summary(job, total_summary)
        _count_for_key(job, user_summary, lambda j: j.extensions.user_id)
        _count_for_key(job, job_name_summary, lambda j: j.name)

    return AggregationResponse(
        summary=_to_summary_counts(total_summary),
        aggregations=[
            _to_aggregation('User Id', 'userId', user_summary),
            _to_aggregation('Job Name', 'name', job_name_summary)
        ])


def _count_total_summary(job, total_summary):
    if job.status not in total_summary:
        total_summary[job.status] = 0
    total_summary[job.status] += 1


def _count_for_key(job, summary, key_lambda):
    key = key_lambda(job)

    count = summary.get(key, {})

    if job.status not in count:
        count[job.status] = 0
    count[job.status] += 1

    summary[key] = count


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


def _get_stub_data(summaryCounts, user_aggregation, job_name_aggregation):
    return AggregationResponse(
        summary=summaryCounts,
        aggregations=[user_aggregation, job_name_aggregation])


def _auth_token():
    """Get the authentication token from the request header.

        Returns:
            string: authentication token in header
    """
    auth_header = request.headers.get('Authentication')
    if auth_header:
        components = auth_header.split(' ')
        if len(components) == 2 and components[0] == 'Bearer':
            return components[1]
    return None


def _provider_type():
    """Get the provider type.

        Returns:
            string: provider type defined in current_app.config file
    """
    return current_app.config['PROVIDER_TYPE']
