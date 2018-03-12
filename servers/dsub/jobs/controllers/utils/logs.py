def dsub_to_api(job):
    """Extracts logs from a job, if present.

        Args:
            job: A dict with dsub job metadata

        Returns:
            dict: Labels key value pairs with dsub controller, stderr, and stdout
                log files
    """
    if job['logging'] and job['logging'].endswith('.log'):
        base_log_path = job['logging'][:-4]
        return {
            'Controller Log': '{}.log'.format(base_log_path),
            'Output Log': '{}-stderr.log'.format(base_log_path),
            'Error Log': '{}-stdout.log'.format(base_log_path),
        }
    return None
