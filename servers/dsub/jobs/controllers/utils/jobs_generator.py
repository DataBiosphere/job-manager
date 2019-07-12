import datetime

from dsub.commands import ddel, dstat

from jobs.common import execute_redirect_stdout
from jobs.controllers.utils import extensions, failures, job_ids, job_statuses, labels, providers, query_parameters
from jobs.models.query_jobs_result import QueryJobsResult

_MAX_RUNTIME_DAYS = 7


def generate_jobs(provider, query, create_time_max=None, offset_id=None):
    """Get the generator of jobs according to the specified filters.

    Args:
        provider (str): type of provider
        query (QueryJobsRequest): query body
        create_time_max (datetime): the latest job create time
        offset_id (str): paginator offset id

    Returns:
        generator: Retrieved jobs
    """
    proj_id = query.extensions.project_id if query.extensions else None
    dstat_params = query_parameters.api_to_dsub(query)

    # If create_time_max is not set, but we have to client-side filter by
    # end-time, set create_time_max = query.end because all the jobs with
    # create_time >= query.end cannot possibly match the query.
    if not create_time_max and query.end:
        create_time_max = query.end

    # If submission time is not specified, set the create_time_min to (start time - 7days)
    # to avoid iterating through the whole job list.
    create_time_min = dstat_params.get('create_time')
    if not create_time_min and query.start:
        create_time_min = query.start - datetime.timedelta(
            days=_MAX_RUNTIME_DAYS)

    jobs = execute_redirect_stdout(lambda: dstat.lookup_job_tasks(
        provider=provider,
        statuses=dstat_params['statuses'],
        user_ids=dstat_params.get('user_ids'),
        job_ids=dstat_params.get('job_ids'),
        task_ids=dstat_params.get('task_ids'),
        task_attempts=dstat_params.get('task_attempts'),
        create_time_min=create_time_min,
        create_time_max=create_time_max,
        job_names=dstat_params.get('job_names'),
        labels=dstat_params.get('labels')))

    last_create_time = None
    job_buffer = []
    for j in jobs:
        job = _query_jobs_result(j, proj_id)
        # Filter pending vs. running jobs since dstat does not have
        # a corresponding status (both RUNNING)
        if query.status and job.status not in query.status:
            continue
        if query.start and (not job.start or job.start < query.start):
            continue
        if query.end and (not job.end or job.end > query.end):
            continue

        # If this job is from the last page, skip it and continue generating
        if create_time_max and job.submission == create_time_max:
            if offset_id and job.id < offset_id:
                continue

        # Build up a buffer of jobs with the same create time. Once we get a
        # job with an older create time we yield all the jobs in the buffer
        # sorted by job-id + task-id
        job_buffer.append(job)
        if job.submission != last_create_time:
            for j in sorted(job_buffer, key=lambda j: j.id):
                yield j
            job_buffer = []
        last_create_time = job.submission

    # If we hit the end of the dstat job generator, ensure to yield the jobs
    # stored in the buffer before returning
    for j in sorted(job_buffer, key=lambda j: j.id):
        yield j


def generate_jobs_by_window(provider, project_id, window_min, window_max=None):
    """Get the generator of jobs for aggregation.
    If the window_max is specified, running jobs will not be returned.

    Args:
        provider (str): type of provider
        project_id (str): the project id
        window_min (datetime): the earliest time of aggregation time window
        window_max (datetime): the latest time of aggregation time window

    Returns:
        generator: Retrieved jobs
    """
    create_time_min = None

    if window_min is not None:
        create_time_min = window_min - datetime.timedelta(
            days=_MAX_RUNTIME_DAYS)

    jobs = execute_redirect_stdout(
        lambda: dstat.lookup_job_tasks(provider=provider,
                                       statuses=None,
                                       user_ids=None,
                                       job_ids=None,
                                       task_ids=None,
                                       create_time_min=create_time_min,
                                       create_time_max=window_max,
                                       job_names=None,
                                       labels=None))

    for j in jobs:
        job = _query_jobs_result(j, project_id)
        # Filter jobs that do no end within the time window
        if job.end and (window_min and job.end < window_min
                        or window_max and job.end > window_max):
            continue

        yield job


def _query_jobs_result(job, project_id=None):
    return QueryJobsResult(
        id=job_ids.dsub_to_api(project_id, job['job-id'], job.get('task-id'),
                               job.get('task-attempt')),
        name=job['job-name'],
        status=job_statuses.dsub_to_api(job),
        # The LocalJobProvider returns create-time with millisecond granularity.
        # For consistency with the GoogleJobProvider, truncate to second
        # granularity.
        submission=job['create-time'].replace(microsecond=0),
        start=job.get('start-time'),
        end=job['end-time'],
        labels=labels.dsub_to_api(job),
        extensions=extensions.get_extensions(job))
