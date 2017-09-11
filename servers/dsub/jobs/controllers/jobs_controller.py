import connexion
from jobs.models.job_abort_response import JobAbortResponse
from jobs.models.job_metadata_response import JobMetadataResponse
from jobs.models.job_query_request import JobQueryRequest
from jobs.models.job_query_response import JobQueryResponse
from datetime import date, datetime
from typing import List, Dict
from six import iteritems
from ..util import deserialize_date, deserialize_datetime


def abort_job(id):
    """
    Abort a job by ID

    :param id: Job ID
    :type id: str

    :rtype: JobAbortResponse
    """
    return 'do some magic!'


def get_job(id):
    """
    Query for job and task-level metadata for a specified job

    :param id: Job ID
    :type id: str

    :rtype: JobMetadataResponse
    """
    return 'do some magic!'


def query_jobs(parameters):
    """
    Query jobs by start dates, end dates, names, ids, or statuses.

    :param parameters: Same query parameters as GET /query endpoint, submitted as a json list. Example: [{"status":"Success"},{"status":"Failed"}]
    :type parameters: list | bytes

    :rtype: JobQueryResponse
    """
    if connexion.request.is_json:
        parameters = JobQueryRequest.from_dict(connexion.request.get_json())
    return 'do some magic!'
