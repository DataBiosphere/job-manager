from jobs.controllers.utils.providers import ProviderType
from jobs.models.authentication_capability import AuthenticationCapability
from jobs.models.capabilities_response import CapabilitiesResponse


def get_capabilities():
    """Get the capabilities of this backend implementation.

    Returns:
        CapabilitiesResponse: Response containing this backend's capabilities
    """
    capabilities = CapabilitiesResponse(
        display_fields={
            'name': 'Job',
            'status': 'Status',
            'submission': 'Submitted',
            'labels.job_id': 'Job ID',
            'labels.task_id': 'Task ID',
            'extensions.userId': 'User ID',
            'extensions.statusDetail': 'Status Detail'
        },
        common_labels=['job-id', 'task-id'],
        query_extensions=['projectId', 'userId', 'submission'])

    if _provider_type() == ProviderType.GOOGLE:
        capabilities.authentication = AuthenticationCapability(
            is_required=true,
            scopes=[
                'https://www.googleapis.com/auth/genomics',
                'https://www.googleapis.com/auth/cloudplatformprojects.readonly'
            ])

    return capabilities


def _provider_type():
    return current_app.config['PROVIDER_TYPE']
