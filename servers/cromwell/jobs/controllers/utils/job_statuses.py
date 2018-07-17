from jobs.common import enum

# The execution statuses of Cromwell are defined here:
# https://github.com/broadinstitute/cromwell/blob/710c1931a6745a187ffd026f2cdafea2ffaaf2dc/core/src/main/scala/cromwell/core/ExecutionStatus.scala#L5
# It provided a reasonable mapping in this file, but may need to be changed in the future on demand

ApiStatus = enum(
    SUBMITTED='Submitted',
    ONHOLD='OnHold',
    RUNNING='Running',
    ABORTING='Aborting',
    ABORTED='Aborted',
    FAILED='Failed',
    SUCCEEDED='Succeeded')
CromwellWorkflowStatus = enum(
    SUBMITTED='Submitted',
    ONHOLD='On Hold',
    RUNNING='Running',
    ABORTING='Aborting',
    FAILED='Failed',
    SUCCEEDED='Succeeded')

API_WORKFLOW_STATUS_MAP = {
    ApiStatus.SUBMITTED: CromwellWorkflowStatus.SUBMITTED,
    ApiStatus.ONHOLD: CromwellWorkflowStatus.ONHOLD,
    ApiStatus.RUNNING: CromwellWorkflowStatus.RUNNING,
    ApiStatus.ABORTING: CromwellWorkflowStatus.ABORTING,
    ApiStatus.ABORTED: CromwellWorkflowStatus.FAILED,
    ApiStatus.FAILED: CromwellWorkflowStatus.FAILED,
    ApiStatus.SUCCEEDED: CromwellWorkflowStatus.SUCCEEDED
}


def api_workflow_status_to_cromwell(api_status):
    """ Map an API workflow status to a Cromwell status.

  :param str api_status: 'Submitted', 'On Hold', 'Running', 'Aborting', 'Failed', 'Succeeded'
  :return: Cromwell status 'Submitted', 'OnHold', 'Aborting', 'Failed' or 'Succeeded'
  """
    if api_status not in API_WORKFLOW_STATUS_MAP:
        raise ValueError(
            'Unrecognized API execution status: {}'.format(api_status))
    return API_WORKFLOW_STATUS_MAP[api_status]
