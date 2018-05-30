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
        source_file=script,
        events=hack_events())


def hack_events():
    """Place hard coded events information.

    """
    events = [{
        "description": "start",
        "startTime": "2018-05-24T21:42:51.109104814Z"
    }, {
        "description": "pulling-image",
        "startTime": "2018-05-24T21:42:51.109147076Z"
    }, {
        "description": "localizing-files",
        "startTime": "2018-05-24T21:43:05.783703332Z"
    }, {
        "description": "running-docker",
        "startTime": "2018-05-24T21:43:05.783735828Z"
    }, {
        "description": "delocalizing-files",
        "startTime": "2018-05-24T21:43:07.447844496Z"
    }, {
        "description": "ok",
        "startTime": "2018-05-24T21:43:10.428214323Z"
    }]

    return events
