import requests
import connexion
from requests.auth import HTTPBasicAuth
from flask import current_app
from datetime import datetime

from jobs.models.query_jobs_result import QueryJobsResult
from jobs.models.query_jobs_request import QueryJobsRequest
from jobs.models.query_jobs_response import QueryJobsResponse


def abort_job(id):
    """
    Abort a job by ID

    :param id: Job ID
    :type id: str

    :rtype: None
    """
    return 'abort job'


def get_job(id):
    """
    Query for job and task-level metadata for a specified job

    :param id: Job ID
    :type id: str

    :rtype: JobMetadataResponse
    """
    return 'get job'


def query_jobs(body):
    """
    Query jobs by various filter criteria. Returned jobs are ordered from newest to oldest submission time.

    :param body:
    :type body: dict | bytes

    :rtype: QueryJobsResponse
    """
    config = current_app.config
    query = QueryJobsRequest.from_dict(body)
    query_url = config['cromwell_url'] + '/query'
    query_params = []
    if query.start:
        query_params.append({'start': query.start})
    if query.end:
        query_params.append({'end': query.end})
    if query.name:
        query_params.append({'name': query.name})
    if query.statuses:
        statuses = [{'status': s} for s in set(query.statuses)]
        query_params.extend(statuses)
    response = requests.post(query_url, json=query_params, auth=HTTPBasicAuth(config['cromwell_user'], config['cromwell_password']))
    results = [format_job(job) for job in response.json()['results']]
    sorted_jobs = sorted(results, key=lambda x: x.start, reverse=True)
    return QueryJobsResponse(results=sorted_jobs)


def format_job(job):
    start = parse_datetime(job.get('start'))
    end = None
    if job.get('end'):
        end = parse_datetime(job.get('end'))
    return QueryJobsResult(
        id=job.get('id'),
        name=job.get('name'),
        status=job.get('status'),
        submission=start,
        start=start,
        end=end
    )


def parse_datetime(date_string):
    # Handles issue where some dates in cromwell do not contain milliseconds
    try:
        formatted_date = datetime.strptime(date_string, '%Y-%m-%dT%H:%M:%S.%fZ')
    except ValueError:
        formatted_date = datetime.strptime(date_string, '%Y-%m-%dT%H:%M:%SZ')
    return formatted_date
