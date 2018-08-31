from providers import ProviderType
from werkzeug.exceptions import BadRequest


def api_to_dsub(api_id, provider_type):
    """Convert an API ID and provider type to dsub project, job, and task IDs

        Args:
            api_id (str): The API ID corresponding to a particular dsub task.
                Depending on the provider and semantics of the job, the ID can
                have one of four possible schemas described in comments below.
            provider_type (ProviderType): The dsub provider currently being
                used. Currently the options are google, local, or stub.

        Returns:
            (str, str, str, str): dsub project ID, job ID, task ID, and attempt
                number, respectively. The job ID will never be empty, but
                project ID, task ID, and attempt number may be.

        Raises:
            BadRequest if the api_id format is invalid for the given provider
    """
    id_split = api_id.split('+')
    if len(id_split) != 4:
        raise BadRequest(
            'Job ID format is: <project-id>+<job-id>+<task-id>+<attempt>')
    project, job, task, attempt = id_split
    google_providers = [ProviderType.GOOGLE, ProviderType.GOOGLE_V2]
    if not project and provider_type in google_providers:
        raise BadRequest(
            'Job ID is missing project ID component with google provider')
    return id_split


def dsub_to_api(proj_id, job_id, task_id, attempt):
    """Convert a dsub project, job, and task IDs to an API ID

        Args:
            proj_id (str): dsub Google cloud project ID (google provider only)
            job_id (str): dsub job ID (all providers)
            task_id (str): dsub task ID (if job was started with multiple tasks)

        Returns:
            (str): API ID formed by composition of one or more of the inputs

        Raises:
            BadRequest if no job_id is provided
    """
    if not job_id:
        raise BadRequest('Invalid dsub ID format, no job_id was provided')
    return '{}+{}+{}+{}'.format(proj_id, job_id, task_id, attempt)
