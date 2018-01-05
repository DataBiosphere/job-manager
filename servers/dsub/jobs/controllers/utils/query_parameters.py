import datetime
from dateutil.tz import tzutc
from dsub.lib import param_util

import job_statuses


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
        for s in query.statuses
    } if query.statuses else {'*'}

    if query.start:
        epoch = datetime.datetime.utcfromtimestamp(0).replace(tzinfo=tzutc())
        dstat_params['create_time'] = int(
            (query.start - epoch).total_seconds())
    if query.name:
        dstat_params['job_names'] = {query.name}
    if query.labels:
        if query.labels.get('job-id'):
            dstat_params['job_ids'] = {query.labels['job-id']}
        if query.labels.get('task-id'):
            dstat_params['task_ids'] = {query.labels['task-id']}
        if query.labels.get('user-id'):
            dstat_params['user_ids'] = {query.labels['user-id']}

        dstat_params['labels'] = {
            param_util.LabelParam(k, v)
            for (k, v) in query.labels.items()
            if k not in ['job-id', 'task-id', 'user-id']
        }

    return dstat_params
