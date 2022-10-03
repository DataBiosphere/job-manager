from __future__ import absolute_import
from dateutil.tz import tzutc
from dsub.lib import job_model, param_util

from . import job_statuses


def api_to_dsub(query):
    """Construct the dstat query parameters from an QueryJobsRequest.

        Args:
            query: An API query request

        Returns:
            dict: Key value pairs of query parameters, formatted for dstat
    """

    dstat_params = {}

    dstat_params['statuses'] = {
        job_statuses.api_to_dsub(s)
        for s in query.status
    } if query.status else {'*'}

    if query.name:
        dstat_params['job_names'] = {query.name}
    if query.labels:
        if query.labels.get('job-id'):
            dstat_params['job_ids'] = {query.labels['job-id']}
        if query.labels.get('task-id'):
            dstat_params['task_ids'] = {query.labels['task-id']}
        if query.labels.get('attempt'):
            dstat_params['task_attempts'] = {query.labels['attempt']}
        dstat_params['labels'] = {
            job_model.LabelParam(k, v)
            for (k, v) in query.labels.items()
            if k not in ['job-id', 'task-id', 'attempt']
        }
    if query.submission:
        dstat_params['create_time'] = query.submission

    if query.extensions:
        if query.extensions.user_id:
            dstat_params['user_ids'] = {query.extensions.user_id}

    return dstat_params
