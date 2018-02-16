from jobs.models.capabilities_response import CapabilitiesResponse


def get_capabilities():
    """Get the capabilities of this backend implementation.

    Returns:
        CapabilitiesResponse: Response containing this backend's capabilities
    """
    return CapabilitiesResponse(
        display_fields={
            'name': 'Job',
            'status': 'Status',
            'submission': 'Submitted',
            'labels.cromwell-workflow-name': "Workflow Name",
            'labels.cromwell-workflow-id': "Workflow ID",
            'labels.comment': "Comment"
        },
        common_labels=[],
        extended_query_fields=[])
