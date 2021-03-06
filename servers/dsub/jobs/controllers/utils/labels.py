def dsub_to_api(job):
    """Extracts labels from a job, if present.

        Args:
            job: A dict with dsub job metadata

        Returns:
            dict: Labels key value pairs with dsub-specific information
    """
    labels = job['labels'].copy() if job['labels'] else {}
    if 'job-id' in job:
        labels['job-id'] = job['job-id']
    if 'task-id' in job:
        labels['task-id'] = job['task-id']
    if 'task-attempt' in job:
        labels['attempt'] = job['task-attempt']
    return labels
