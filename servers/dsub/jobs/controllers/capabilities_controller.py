from collections import OrderedDict
from flask import current_app

from jobs.models.authentication_capability import AuthenticationCapability
from jobs.models.capabilities_response import CapabilitiesResponse
from jobs.models.display_field import DisplayField
from jobs.controllers.utils.providers import ProviderType


def get_capabilities():
    """Get the capabilities of this backend implementation.

    Returns:
        CapabilitiesResponse: Response containing this backend's capabilities
    """
    capabilities = CapabilitiesResponse(
        display_fields=[
            DisplayField(field='name', display='Name', filterable=True),
            DisplayField(field='status', display='Status'),
            DisplayField(field='submission',
                         display='Submitted',
                         field_type='date'),
            DisplayField(field='labels.job-id', display='Job ID'),
            DisplayField(field='labels.task-id', display='Task ID'),
            DisplayField(field='labels.attempt', display='Attempt'),
            DisplayField(field='extensions.userId', display='User ID'),
            DisplayField(field='extensions.statusDetail',
                         display='Status Detail'),
        ],
        common_labels=['job-id', 'task-id', 'attempt'],
        query_extensions=['userId'])

    if _provider_type() in [ProviderType.GOOGLE, ProviderType.GOOGLE_V2]:
        capabilities.authentication = AuthenticationCapability(
            is_required=True,
            scopes=[
                'https://www.googleapis.com/auth/genomics',
                'https://www.googleapis.com/auth/cloudplatformprojects.readonly',
                'https://www.googleapis.com/auth/devstorage.read_only',
            ])
        capabilities.query_extensions.append('projectId')

    return capabilities


def _provider_type():
    return current_app.config['PROVIDER_TYPE']
