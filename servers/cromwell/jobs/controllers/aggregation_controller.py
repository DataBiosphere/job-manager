import connexion
from jobs.models.aggregation_response import AggregationResponse
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

    raise NotImplemented('function not implemented yet.')