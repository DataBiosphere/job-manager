from flask import current_app
from jobs.models.capabilities_response import CapabilitiesResponse
from jobs.models.authentication_capability import AuthenticationCapability
from jobs.models.display_field import DisplayField
import logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger('{module_path}'.format(module_path=__name__))


def get_capabilities():
    """Get the capabilities of this backend implementation.

    Returns:
        CapabilitiesResponse: Response containing this backend's capabilities
    """
    # Check if a capabilities config is given
    # Set outside_auth to True if a SAM server is going to be used
    if 'capabilities' in current_app.config:
        config_capabilities = current_app.config['capabilities']
        logger.warning('sam_url: {}'.format(current_app.config['sam_url']))
        if current_app.config['sam_url'] and config_capabilities.authentication:
            config_capabilities.authentication = AuthenticationCapability(
                is_required=config_capabilities.authentication.is_required,
                scopes=config_capabilities.authentication.scopes,
                forced_logout_domains=config_capabilities.authentication.
                forced_logout_domains,
                forced_logout_time=config_capabilities.authentication.
                forced_logout_time,
                outside_auth=True)
        return config_capabilities

    # Default capabilities configuration
    capabilities = CapabilitiesResponse(
        display_fields=[
            DisplayField(field='id', display='Workflow ID'),
            DisplayField(field='name', display='Name', filterable=True),
            DisplayField(field='status', display='Status'),
            DisplayField(field='submission',
                         display='Submitted',
                         field_type='date'),
            DisplayField(field='labels.label',
                         display='Label',
                         editable=True,
                         bulk_editable=True,
                         field_type='text'),
            DisplayField(field='labels.flag',
                         display='Flag',
                         editable=True,
                         bulk_editable=True,
                         field_type='list',
                         valid_field_values=['archive', 'follow-up']),
            DisplayField(field='labels.comment',
                         display='Comment',
                         editable=True,
                         field_type='text')
        ],
        common_labels=['id', 'name', 'label', 'flag'],
        query_extensions=['hideArchived'])
    return capabilities
