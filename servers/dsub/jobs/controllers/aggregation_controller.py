from jobs.controllers.utils import generator, time_convert, providers
from jobs.models.aggregation import Aggregation
from jobs.models.aggregation_entry import AggregationEntry
from jobs.models.aggregation_response import AggregationResponse
from jobs.models.query_jobs_request import QueryJobsRequest
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
    query = QueryJobsRequest.from_dict({
        'extensions': {
            'project_id': projectId
        }
    })

    query.start = time_convert.time_frame_to_start_time(timeFrame)
    query.extensions.project_id = projectId

    provider = providers.get_provider(generator.provider_type(), projectId,
                                      generator.auth_token())
    job_generator = generator.generate_jobs(provider, query)

    summary_counts = {}
    for job in job_generator:
        _count_summary(job, summary_counts)

    return _get_stub_data(_to_summary_counts(summary_counts))


def _count_summary(job, summary_counts):
    if job.status not in summary_counts:
        summary_counts[job.status] = 0
    summary_counts[job.status] += 1


def _to_summary_counts(summary_counts):
    return StatusCounts([
        StatusCount(status, count) for status, count in summary_counts.items()
    ])


def _get_stub_data(summaryCounts):
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

    userEntry1 = AggregationEntry(
        label='circleci',
        status_counts=StatusCounts(counts=[
            StatusCount(status='Succeeded', count=3),
            StatusCount(status='Failed', count=7)
        ]))

    userEntry2 = AggregationEntry(
        label='otherUser',
        status_counts=StatusCounts(counts=[
            StatusCount(status='Succeeded', count=7),
            StatusCount(status='Failed', count=4)
        ]))

    ownerAggregation = Aggregation(
        name='AnotherLabel', key='job-id', entries=[entry1, entry2])

    projectAggregation = Aggregation(
        name='User', key='userId', entries=[userEntry1, userEntry2])

    return AggregationResponse(
        summary=summaryCounts,
        aggregations=[ownerAggregation, projectAggregation])
