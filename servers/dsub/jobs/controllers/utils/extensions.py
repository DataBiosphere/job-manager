from jobs.controllers.utils import logs
from jobs.models.extended_fields import ExtendedFields


def get_extensions(job):
    """Extracts ExtendedFields from a job, if present.

        Args:
            job: A dict with dsub job metadata

        Returns:
            ExtendedFields: Populated extensions on the job
    """
    envs = job['envs']
    script = None
    if envs and envs['_SCRIPT']:
        script = envs['_SCRIPT']
        del envs['_SCRIPT']

    return ExtendedFields(
        user_id=job['user-id'],
        status_detail=job.get('status-detail'),
        logs=logs.dsub_to_api(job),
        last_update=job.get('last-update'),
        envs=job['envs'],
        script=script)
