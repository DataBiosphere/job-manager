from jobs.models.capabilities_response import CapabilitiesResponse
from jobs.models.display_field import DisplayField


def get_capabilities():
    """Get the capabilities of this backend implementation.

    Returns:
        CapabilitiesResponse: Response containing this backend's capabilities
    """
    return CapabilitiesResponse(
        display_fields=[
            DisplayField(field='name', display='Job'),
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
        extended_query_fields=[])
