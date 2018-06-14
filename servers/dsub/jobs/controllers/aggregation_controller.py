import connexion
from jobs.models.aggregation_response import AggregationResponse
from datetime import date, datetime
from typing import List, Dict
from six import iteritems
from ..util import deserialize_date, deserialize_datetime


def get_job_aggregations(timeFrame, projectId=None):
    """
    Query for aggregated jobs in the given time frame.
    
    :param timeFrame: Time Frame to aggregate over.
    :type timeFrame: str
    :param projectId: The ID of the project to query.
    :type projectId: str

    :rtype: AggregationResponse
    """
    return 'do some magic!'
