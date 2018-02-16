from jobs.controllers.utils import logs
from jobs.models.extended_fields import ExtendedFields


def get_extensions(job):
    """Extracts ExtendedFields from a job, if present.

        Args:
            job: A dict with dsub job metadata

        Returns:
            ExtendedFields: Populated extensions on the job
    """
    return ExtendedFields(
    	user_id=job['user-id'],
        status_detail=job['status-detail'],
        logs=logs.dsub_to_api(job),
        last_update=job['last-update'],
        envs=job['envs'])