from flask import current_app
from jobs.models.authentication_capability import AuthenticationCapability
from jobs.models.capabilities_response import CapabilitiesResponse
from jobs.models.display_field import DisplayField


def get_capabilities():
    """Get the capabilities of this backend implementation.

    Returns:
        CapabilitiesResponse: Response containing this backend's capabilities
    """
    capabilities = CapabilitiesResponse(
        display_fields=[
            DisplayField(field='status', display='Status'),
            DisplayField(field='submission', display='Submitted'),
            DisplayField(
                field='labels.cromwell-workflow-name',
                display='Workflow Name'),
            DisplayField(
                field='labels.cromwell-workflow-id', display='Workflow ID'),
            DisplayField(field='labels.comment', display='Comment')
        ],
        common_labels=[
            'cromwell-workflow-name', 'cromwell-workflow-id', 'comment'
        ],
        query_extensions=[])
    if current_app.config['use_caas']:
        capabilities.authentication = AuthenticationCapability(
            is_required=True,
            scopes=[
                'https://www.googleapis.com/auth/userinfo.profile',
                'https://www.googleapis.com/auth/userinfo.email'
            ])
    return capabilities
