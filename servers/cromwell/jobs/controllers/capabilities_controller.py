from flask import current_app
from jobs.models.capabilities_response import CapabilitiesResponse
from jobs.models.display_field import DisplayField


def get_capabilities():
    """Get the capabilities of this backend implementation.

    Returns:
        CapabilitiesResponse: Response containing this backend's capabilities
    """
    # Check if a capabilities config is given
    if 'capabilities' in current_app.config:
        return current_app.config['capabilities']  # Early return for performance

    # Default capabilities configuration
    capabilities = CapabilitiesResponse(
        display_fields=[
            DisplayField(field='status', display='Status'),
            DisplayField(field='submission', display='Submitted'),
            DisplayField(
                field='labels.cromwell-workflow-id', display='Workflow ID'),
        ],
        common_labels=['cromwell-workflow-id'],
        query_extensions=[])
    return capabilities
