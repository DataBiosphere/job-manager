import connexion

from jobs.models.aggregation_response import AggregationResponse
from jobs.models.status_count import StatusCount
from jobs.models.status_counts import StatusCounts
from jobs.models.aggregation import Aggregation
from jobs.models.aggregation_entry import AggregationEntry

from datetime import date, datetime
from typing import List, Dict
from six import iteritems
from ..util import deserialize_date, deserialize_datetime
from werkzeug.exceptions import NotImplemented


def get_job_aggregations(timeFrame, projectId=None):
    """
    Query for aggregated jobs in the given time frame.

    Args:
        timeFrame (str): Time Frame to aggregate over
        param projectId (str): The ID of the project to query

    Returns:
        AggregationResponse: Response contains aggregation of jobs
    """
    # temporary fake data for testing front-end.
    statusCount1 = StatusCount(status='Succeeded', count=10)

    statusCount2 = StatusCount(status='Failed', count=2)

    summaryCounts = StatusCounts(counts=[statusCount1, statusCount2])

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

    ownerAggregation = Aggregation(name='AnotherLabel', key='job-id', entries=[entry1, entry2])

    projectAggregation = Aggregation(name='User', key='userId', entries=[userEntry1, userEntry2])

    return AggregationResponse(
        summary=summaryCounts,
        aggregations=[ownerAggregation, projectAggregation])
