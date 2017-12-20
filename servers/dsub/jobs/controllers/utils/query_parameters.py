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

    epoch = datetime.datetime.utcfromtimestamp(0).replace(tzinfo=tzutc())
    dstat_params['create_time'] = int(
        (query.start - epoch).total_seconds()) if query.start else None

    dstat_params['job_names'] = {query.name} if query.name else None

    dstat_params['statuses'] = {
        job_statuses.api_to_dsub(s)
        for s in query.statuses
    } if query.statuses else {'*'}

    dstat_params['labels'] = {
        param_util.LabelParam(k, v)
        for (k, v) in query.labels.items()
    } if query.labels else None

    return dstat_params
