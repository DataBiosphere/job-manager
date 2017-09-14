from werkzeug.exceptions import NotFound


class JobNotFound(NotFound):
    def __init__(self, job_id, **kwargs):
        NotFound.__init__(self, '"job {}" not found'.format(job_id), **kwargs)
