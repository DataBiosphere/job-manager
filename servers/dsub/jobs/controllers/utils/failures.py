from jobs.controllers.utils import job_statuses
from jobs.models.failure_message import FailureMessage


def get_failures(job):
    """Extracts failure message from a job, if present.

        Args:
            job: A dict with dsub job metadata

        Returns:
            list<FailureMessage>: A single item list with failure message.
    """
    if (job['status'] == job_statuses.DsubStatus.FAILURE
            and job['status-message'] and job['last-update']):
        return [
            FailureMessage(failure=job['status-message'],
                           timestamp=job['last-update'])
        ]
    return None
