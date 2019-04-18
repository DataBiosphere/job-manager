from jobs.controllers.utils import logs
from jobs.models.event_detail import EventDetail
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
    if envs and '_SCRIPT' in envs:
        script = envs['_SCRIPT']
        del envs['_SCRIPT']

    events = [
        EventDetail(e['start-time'], e['name']) for e in job.get('events', [])
    ]

    return ExtendedFields(user_id=job['user-id'],
                          status_detail=job.get('status-detail'),
                          logs=logs.dsub_to_api(job),
                          last_update=job.get('last-update'),
                          envs=job['envs'],
                          source_file=script,
                          events=events)
