import connexion

from jobs.models.aggregation_response import AggregationResponse
from jobs.models.status_count import StatusCount
from jobs.models.status_counts import StatusCounts
from jobs.models.aggregation import Aggregation
from jobs.models.aggregation_entry import AggregationEntry
from jobs.models.query_jobs_request import QueryJobsRequest
from jobs.controllers.utils import generator, time_convert, providers, job_statuses

from datetime import date, datetime
from typing import List, Dict
from six import iteritems
from ..util import deserialize_date, deserialize_datetime
from werkzeug.exceptions import NotImplemented


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

    total_count = 0

    summary_counts = {}

    # print(type(job_statuses.ApiStatus))
    # for status in job_statuses.ApiStatus:
    #     print(status)

    for job in job_generator:
        total_count += 1
        _summary_count(job, summary_counts)

    print("total: ", total_count, ", details: ", summary_counts)

    return _get_stub_data(_to_summary_counts(summary_counts))


def _summary_count(job, summary_counts):
    if job.status == job_statuses.ApiStatus.SUBMITTED:
        summary_counts[
            job_statuses.ApiStatus.SUBMITTED] = summary_counts.setdefault(
                job_statuses.ApiStatus.SUBMITTED, 0) + 1
    elif job.status == job_statuses.ApiStatus.RUNNING:
        summary_counts[
            job_statuses.ApiStatus.RUNNING] = summary_counts.setdefault(
                job_statuses.ApiStatus.RUNNING, 0) + 1
    elif job.status == job_statuses.ApiStatus.ABORTING:
        summary_counts[
            job_statuses.ApiStatus.ABORTING] = summary_counts.setdefault(
                job_statuses.ApiStatus.ABORTING, 0) + 1
    elif job.status == job_statuses.ApiStatus.ABORTED:
        summary_counts[
            job_statuses.ApiStatus.ABORTED] = summary_counts.setdefault(
                job_statuses.ApiStatus.ABORTED, 0) + 1
    elif job.status == job_statuses.ApiStatus.SUCCEEDED:
        summary_counts[
            job_statuses.ApiStatus.SUCCEEDED] = summary_counts.setdefault(
                job_statuses.ApiStatus.SUCCEEDED, 0) + 1
    elif job.status == job_statuses.ApiStatus.FAILED:
        summary_counts[
            job_statuses.ApiStatus.FAILED] = summary_counts.setdefault(
                job_statuses.ApiStatus.FAILED, 0) + 1


def _to_summary_counts(summary_counts):
    counts = []

    for status, count in summary_counts.items():
        counts.append(StatusCount(status, count))

    return StatusCounts(counts)


def _get_stub_data(summaryCounts):
    # temporary fake data for testing front-end.
    # statusCount1 = StatusCount(status='Succeeded', count=10)

    # statusCount2 = StatusCount(status='Failed', count=2)

    # summaryCounts = StatusCounts(counts=[statusCount1, statusCount2])

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
