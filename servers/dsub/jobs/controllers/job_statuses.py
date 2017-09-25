from werkzeug.exceptions import BadRequest

# Once dsub exposes valid statuses update this to not be a manual map
# https://github.com/googlegenomics/dsub/issues/66
# Swagger-codegen does not generate an enum of constants for model definitions
# so they are mapped them out manually as well
# https://github.com/swagger-api/swagger-codegen/issues/6529

API_STATUS_MAP = {
    'Submitted': 'RUNNING',
    'Running': 'RUNNING',
    'Aborting': 'RUNNING',
    'Aborted': 'CANCELED',
    'Succeeded': 'SUCCESS',
    'Failed': 'FAILURE',
}

DSUB_STATUS_MAP = {
    'RUNNING': 'Running',
    'CANCELED': 'Aborted',
    'SUCCESS': 'Succeeded',
    'FAILURE': 'Failed',
}


def dsub_to_api(dsub_status):
    """Map an API status to a dsub status

      Args:
          dsub_status (str): 'RUNNING', 'CANCELED', 'SUCCESS', or 'FAILURE'

      Returns:
          str: api status 'Running', 'Aborted', 'Succeeded', or 'Failed'
          
      Raises:
          BadRequest if the dsub_status is not valid
    """
    if dsub_status not in DSUB_STATUS_MAP:
        raise BadRequest('Unrecognized dsub status:{}'.format(dsub_status))
    return DSUB_STATUS_MAP[dsub_status]


def api_to_dsub(api_status):
    """Map a dsub status to an API status

      Args:
          api_status (str): 'Submitted', 'Running', 'Aborting', 'Aborted', 
                            'Succeeded', or 'Failed'

      Returns:
          str: dsub status 'RUNNING', 'CANCELED', 'SUCCESS', or 'FAILURE'

      Raises:
          BadRequest if the api_status is not valid 
    """
    if api_status not in API_STATUS_MAP:
        raise BadRequest('Unrecognized api status:{}'.format(api_status))
    return API_STATUS_MAP[api_status]
