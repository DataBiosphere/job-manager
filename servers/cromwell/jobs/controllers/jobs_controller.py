import connexion
from jobs.models.job_metadata_response import JobMetadataResponse
from jobs.models.query_jobs_request import QueryJobsRequest
from jobs.models.query_jobs_response import QueryJobsResponse
from datetime import date, datetime
from typing import List, Dict
from six import iteritems
from ..util import deserialize_date, deserialize_datetime


def abort_job(id):
    """
    Abort a job by ID
    
    :param id: Job ID
    :type id: str

    :rtype: None
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


def query_jobs(body):
    """
    Query jobs by various filter criteria. Returned jobs are ordered from newest to oldest submission time. 
    
    :param body: 
    :type body: dict | bytes

    :rtype: QueryJobsResponse
    """
    if connexion.request.is_json:
        body = QueryJobsRequest.from_dict(connexion.request.get_json())
    return 'do some magic!'
