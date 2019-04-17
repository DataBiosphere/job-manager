from jobs.common import enum

# The execution statuses of Cromwell are defined here:
# https://github.com/broadinstitute/cromwell/blob/710c1931a6745a187ffd026f2cdafea2ffaaf2dc/core/src/main/scala/cromwell/core/ExecutionStatus.scala#L5
# It provided a reasonable mapping in this file, but may need to be changed in the future on demand

ApiStatus = enum(SUBMITTED='Submitted',
                 ON_HOLD='OnHold',
                 RUNNING='Running',
                 ABORTING='Aborting',
                 ABORTED='Aborted',
                 FAILED='Failed',
                 SUCCEEDED='Succeeded')
CromwellWorkflowStatus = enum(SUBMITTED='Submitted',
                              ON_HOLD='On Hold',
                              RUNNING='Running',
                              ABORTING='Aborting',
                              ABORTED='Aborted',
                              FAILED='Failed',
                              SUCCEEDED='Succeeded')

API_STATUS_MAP = {
    ApiStatus.SUBMITTED: CromwellWorkflowStatus.SUBMITTED,
    ApiStatus.ON_HOLD: CromwellWorkflowStatus.ON_HOLD,
    ApiStatus.RUNNING: CromwellWorkflowStatus.RUNNING,
    ApiStatus.ABORTING: CromwellWorkflowStatus.ABORTING,
    ApiStatus.ABORTED: CromwellWorkflowStatus.ABORTED,
    ApiStatus.FAILED: CromwellWorkflowStatus.FAILED,
    ApiStatus.SUCCEEDED: CromwellWorkflowStatus.SUCCEEDED
}

CROMWELL_STATUS_MAP = {
    CromwellWorkflowStatus.SUBMITTED: ApiStatus.SUBMITTED,
    CromwellWorkflowStatus.ON_HOLD: ApiStatus.ON_HOLD,
    CromwellWorkflowStatus.RUNNING: ApiStatus.RUNNING,
    CromwellWorkflowStatus.ABORTING: ApiStatus.ABORTING,
    CromwellWorkflowStatus.ABORTED: ApiStatus.ABORTED,
    CromwellWorkflowStatus.FAILED: ApiStatus.FAILED,
    CromwellWorkflowStatus.SUCCEEDED: ApiStatus.SUCCEEDED
}


def api_workflow_status_to_cromwell(api_status):
    """ Map an API workflow status to a Cromwell status.

  :param str api_status: 'Submitted', 'On Hold', 'Running', 'Aborting', 'Aborted', 'Failed', 'Succeeded'
  :return: Cromwell status 'Submitted', 'OnHold', 'Running', 'Aborting', 'Aborted', 'Failed' or 'Succeeded'
  """
    if api_status not in API_STATUS_MAP:
        raise ValueError(
            'Unrecognized API execution status: {}'.format(api_status))
    return API_STATUS_MAP[api_status]


def cromwell_workflow_status_to_api(cromwell_status):
    """ Map an API workflow status to a Cromwell status.

  :param str cromwell_status: 'Submitted', 'On Hold', 'Running', 'Aborting', 'Aborted', 'Failed', 'Succeeded'
  :return:  API status 'Submitted', 'OnHold', 'Running', 'Aborting', 'Aborted', 'Failed' or 'Succeeded'
  """
    if cromwell_status not in CROMWELL_STATUS_MAP:
        raise ValueError('Unrecognized Cromwell execution status: {}'.format(
            cromwell_status))
    return CROMWELL_STATUS_MAP[cromwell_status]
