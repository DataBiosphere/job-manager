def dsub_to_api(job):
    """Extracts labels from a job, if present.

        Args:
            job: A dict with dsub job metadata

        Returns:
            dict: Labels key value pairs with dsub-specific information
    """
    # Put any dsub specific information into the labels. These fields are
    # candidates for the common jobs API
    labels = job['labels'].copy() if job['labels'] else {}
    if 'status-detail' in job:
        labels['status-detail'] = job['status-detail']
    if 'last-update' in job:
        labels['last-update'] = job['last-update']
    if 'user-id' in job:
        labels['user-id'] = job['user-id']
    if 'job-id' in job:
        labels['job-id'] = job['job-id']
    if 'task-id' in job:
        labels['task-id'] = job['task-id']

    return labels
