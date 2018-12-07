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
        return current_app.config[
            'capabilities']  # Early return for performance

    # Default capabilities configuration
    capabilities = CapabilitiesResponse(
        display_fields=[
            DisplayField(field='id', display='Workflow ID'),
            DisplayField(field='name', display='Name', filterable=True),
            DisplayField(field='status', display='Status'),
            DisplayField(field='submission', display='Submitted'),
            DisplayField(
                field='labels.label',
                display='Label',
                editable=True,
                bulk_editable=True,
                field_type='text'),
            DisplayField(
                field='labels.flag',
                display='Flag',
                editable=True,
                bulk_editable=True,
                field_type='list',
                valid_field_values=['archive', 'follow-up']),
            DisplayField(
                field='labels.comment',
                display='Comment',
                editable=True,
                field_type='text')
        ],
        common_labels=['id', 'name', 'label', 'flag'],
        query_extensions=['hideArchived'])
    return capabilities
