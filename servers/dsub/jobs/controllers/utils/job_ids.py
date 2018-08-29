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
            (str, str, str): dsub project, job, task IDs respectively. The job
                ID will never be None, but both project ID and task ID can be.

        Raises:
            BadRequest if the api_id format is invalid for the given provider
    """
    project, job, task = None, None, None
    id_split = api_id.split('+')

    if provider_type in [ProviderType.GOOGLE, ProviderType.GOOGLE_V2]:
        # If we are running on Google cloud the id format should be:
        # <project-id>+<job-id>+<task-id> or <project-id>+<job-id> if there is
        # no task ID
        if len(id_split) == 2:
            project, job = id_split
        elif len(id_split) == 3:
            project, job, task = id_split
        else:
            raise BadRequest('Job ID format for google provider is: ' +
                             '<project-id>+<job-id>[+<task-id>]?')
    else:
        # Otherwise, the id format should be: <job-id>+<task-id> or <job-id> if
        # there is no task ID
        if len(id_split) == 1:
            job = id_split[0]
        elif len(id_split) == 2:
            job, task = id_split
        else:
            raise BadRequest('Job ID format for non-google provider is: ' +
                             '<job-id>[+<task-id>]?')

    return project, job, task


def dsub_to_api(proj_id, job_id, task_id):
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
    if proj_id and job_id and task_id:
        return '{}+{}+{}'.format(proj_id, job_id, task_id)
    elif proj_id and job_id:
        return '{}+{}'.format(proj_id, job_id)
    elif job_id and task_id:
        return '{}+{}'.format(job_id, task_id)
    elif job_id:
        return job_id
    else:
        raise BadRequest('Invalid dsub ID format, no job_id was provided')
