# Note: This is the dockerfile for development purposes

FROM gcr.io/google-appengine/python

WORKDIR /app

ADD servers/jm_utils /app/jm_utils
ADD servers/cromwell/jobs /app/jobs
COPY servers/cromwell/requirements.txt /app/jobs
RUN cd jobs && pip install -r requirements.txt
# We installed jm_utils so don't need local copy anymore, which breaks imports
RUN rm -rf jm_utils

# Missing required arguments -b PORT, -e ... which must be provided by the
# docker image user.
ENTRYPOINT ["/bin/bash", "/scripts/await_md5_match.sh", "/app/jobs/models/.jobs.yaml.md5", "--", "gunicorn", "jobs:run()"]
