from jobs.controllers.utils import generator, time_convert, providers
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
    window_min = time_convert.time_frame_to_start_time(timeFrame)
    provider = providers.get_provider(generator.provider_type(), projectId,
                                      generator.auth_token())

    job_generator = generator.generate_jobs_count(provider, projectId,
                                                  window_min)

    total_summary = {}
    user_summary = {}

    for job in job_generator:
        _count_total_summary(job, total_summary)
        _count_user_summary(job, user_summary)

    return _get_stub_data(
        _to_summary_counts(total_summary),
        _to_user_aggregation_entry(user_summary))


def _count_total_summary(job, total_summary):
    if job.status not in total_summary:
        total_summary[job.status] = 0
    total_summary[job.status] += 1


def _to_summary_counts(summary_counts):
    return StatusCounts([
        StatusCount(status, count) for status, count in summary_counts.items()
    ])


def _count_user_summary(job, user_summary):
    user_id = job.extensions.user_id
    status = job.status

    user_count = user_summary.get(user_id, {})

    if status not in user_count:
        user_count[status] = 0
    user_count[status] += 1

    user_summary[user_id] = user_count


def _to_user_aggregation_entry(user_summary):
    entries = []

    for user_id, countsDict in user_summary.items():
        countsList = []

        for status, count in countsDict.items():
            countsList.append(StatusCount(status=status, count=count))

        entries.append(
            AggregationEntry(
                label=user_id, status_counts=StatusCounts(countsList)))

    return Aggregation(name='UserId', key='userId', entries=entries)


def _get_stub_data(summaryCounts, user_aggregation):
    # temporary fake data for testing front-end.
    entry1 = AggregationEntry(
        label='labelValue1',
        status_counts=StatusCounts(counts=[
            StatusCount(status='Succeeded', count=2),
            StatusCount(status='Failed', count=1)
        ]))

    entry2 = AggregationEntry(
        label='labelValue2',
        status_counts=StatusCounts(counts=[
            StatusCount(status='Succeeded', count=4),
            StatusCount(status='Failed', count=6)
        ]))

    ownerAggregation = Aggregation(
        name='AnotherLabel', key='job-id', entries=[entry1, entry2])

    return AggregationResponse(
        summary=summaryCounts,
        aggregations=[ownerAggregation, user_aggregation])
