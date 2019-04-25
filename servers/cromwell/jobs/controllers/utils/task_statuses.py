from jobs.common import enum

# The execution statuses of Cromwell are defined here:
# https://github.com/broadinstitute/cromwell/blob/710c1931a6745a187ffd026f2cdafea2ffaaf2dc/core/src/main/scala/cromwell/core/ExecutionStatus.scala#L5
# It provided a reasonable mapping in this file, but may need to be changed in the future on demand

ApiStatus = enum(SUBMITTED='Submitted',
                 RUNNING='Running',
                 ABORTING='Aborting',
                 ABORTED='Aborted',
                 SUCCEEDED='Succeeded',
                 FAILED='Failed')
CromwellExecutionStatus = enum(NOTSTARTED='NotStarted',
                               WAITINGFORQUEUESPACE='WaitingForQueueSpace',
                               QUEUEDINCROMWELL='QueuedInCromwell',
                               STARTING='Starting',
                               RUNNING='Running',
                               ABORTING='Aborting',
                               UNSTARTABLE='Unstartable',
                               ABORTED='Aborted',
                               BYPASSED='Bypassed',
                               RETRYABLEFAILURE='RetryableFailure',
                               FAILED='Failed',
                               DONE='Done')

CROMWELL_EXECUTION_STATUS_MAP = {
    CromwellExecutionStatus.NOTSTARTED: ApiStatus.SUBMITTED,
    CromwellExecutionStatus.WAITINGFORQUEUESPACE: ApiStatus.SUBMITTED,
    CromwellExecutionStatus.QUEUEDINCROMWELL: ApiStatus.SUBMITTED,
    CromwellExecutionStatus.STARTING: ApiStatus.SUBMITTED,
    CromwellExecutionStatus.RUNNING: ApiStatus.RUNNING,
    CromwellExecutionStatus.ABORTING: ApiStatus.ABORTING,
    CromwellExecutionStatus.UNSTARTABLE: ApiStatus.FAILED,
    CromwellExecutionStatus.ABORTED: ApiStatus.ABORTED,
    CromwellExecutionStatus.BYPASSED: ApiStatus.SUBMITTED,
    CromwellExecutionStatus.RETRYABLEFAILURE: ApiStatus.FAILED,
    CromwellExecutionStatus.FAILED: ApiStatus.FAILED,
    CromwellExecutionStatus.DONE: ApiStatus.SUCCEEDED
}


def cromwell_execution_to_api(execution_status):
    """ Map a Cromwell execution status to an API status.

    :param str execution_status: 'NotStarted', 'WaitingForQueueSpace', 'QueuedInCromwell', 'Starting', 'Running', 'Aborting', 'Failed',
     'RetryableFailure', 'Done', 'Bypassed', 'Aborted', or 'Unstartable'
    :return: Api status 'Submitted', 'Running', 'Aborting', 'Failed', 'Succeeded', or 'Aborted'
    """
    if execution_status not in CROMWELL_EXECUTION_STATUS_MAP:
        raise ValueError('Unrecognized Cromwell execution status: {}'.format(
            execution_status))
    return CROMWELL_EXECUTION_STATUS_MAP[execution_status]
