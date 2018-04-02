from flask import current_app
from jobs.models.authentication_capability import AuthenticationCapability
from jobs.models.capabilities_response import CapabilitiesResponse
from jobs.models.display_field import DisplayField


def get_capabilities():
    """Get the capabilities of this backend implementation.

    Returns:
        CapabilitiesResponse: Response containing this backend's capabilities
    """
    # Set default capabilities
    capabilities = {
        'display_fields': {
            'status': 'Status',
            'submission': 'Submitted',
            'labels.cromwell-workflow-id': 'Workflow ID'
        },
        'common_labels': ['cromwell-workflow-id'],
        'query_extensions': []
    }

    capabilities_config = current_app.config['capabilities_config']
    if capabilities_config:
        capabilities.update(capabilities_config)

    display_fields, common_labels, query_extensions = [], set([]), set([])

    # Construct display_fields
    for field, display in capabilities['display_fields'].items():
        display_fields.append(DisplayField(field=field, display=display))

    # Construct common_labels, which is used by the query builder
    common_labels.update(capabilities['common_labels'])
    common_labels = list(common_labels)

    # Construct query_extensions
    query_extensions.update(capabilities['query_extensions'])
    query_extensions = list(query_extensions)

    return CapabilitiesResponse(
        display_fields=display_fields,
        common_labels=common_labels,
        query_extensions=query_extensions)
