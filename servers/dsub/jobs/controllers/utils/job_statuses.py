from jobs.common import enum
from werkzeug.exceptions import BadRequest

# Once dsub exposes valid statuses update this to not be a manual map
# https://github.com/googlegenomics/dsub/issues/66
# Swagger-codegen does not generate an enum of constants for model definitions
# so they are mapped them out manually as well
# https://github.com/swagger-api/swagger-codegen/issues/6529

ApiStatus = enum(SUBMITTED='Submitted',
                 ON_HOLD='OnHold',
                 RUNNING='Running',
                 ABORTING='Aborting',
                 ABORTED='Aborted',
                 SUCCEEDED='Succeeded',
                 FAILED='Failed')
DsubStatus = enum(RUNNING='RUNNING',
                  CANCELED='CANCELED',
                  SUCCESS='SUCCESS',
                  FAILURE='FAILURE')

API_STATUS_MAP = {
    ApiStatus.SUBMITTED: DsubStatus.RUNNING,
    ApiStatus.ON_HOLD: DsubStatus.RUNNING,
    ApiStatus.RUNNING: DsubStatus.RUNNING,
    ApiStatus.ABORTING: DsubStatus.RUNNING,
    ApiStatus.ABORTED: DsubStatus.CANCELED,
    ApiStatus.SUCCEEDED: DsubStatus.SUCCESS,
    ApiStatus.FAILED: DsubStatus.FAILURE,
}

DSUB_STATUS_MAP = {
    DsubStatus.RUNNING: ApiStatus.RUNNING,
    DsubStatus.CANCELED: ApiStatus.ABORTED,
    DsubStatus.SUCCESS: ApiStatus.SUCCEEDED,
    DsubStatus.FAILURE: ApiStatus.FAILED,
}


def dsub_to_api(job):
    """Map a dsub status to an API status

        Args:
            dsub_status (str): 'RUNNING', 'CANCELED', 'SUCCESS', or 'FAILURE'

        Returns:
            str: api status 'Running', 'Aborted', 'Succeeded', or 'Failed'

        Raises:
            BadRequest if the dsub_status is not valid
    """
    if job['status'] not in DSUB_STATUS_MAP:
        raise BadRequest('Unrecognized dsub status:{}'.format(dsub_status))
    elif job['status'] == DsubStatus.RUNNING and not job.get('start-time'):
        return ApiStatus.SUBMITTED
    else:
        return DSUB_STATUS_MAP[job['status']]


def api_to_dsub(api_status):
    """Map an API status to a dsub status

        Args:
            api_status (str): 'Submitted', 'OnHold', 'Running', 'Aborting', 'Aborted',
                'Succeeded', or 'Failed'

        Returns:
            str: dsub status 'RUNNING', 'CANCELED', 'SUCCESS', or 'FAILURE'

        Raises:
            BadRequest if the api_status is not valid
    """
    if api_status not in API_STATUS_MAP:
        raise BadRequest('Unrecognized api status:{}'.format(api_status))
    return API_STATUS_MAP[api_status]
