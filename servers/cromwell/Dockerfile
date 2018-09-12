FROM openjdk

WORKDIR /job-manager

ADD ./ /job-manager

RUN /bin/bash -c scripts/rebuild_swagger.sh

FROM gcr.io/google-appengine/python

WORKDIR /app

COPY --from=0 /job-manager/servers/jm_utils /app/jm_utils
COPY --from=0 /job-manager/servers/cromwell/jobs /app/jobs
COPY ./servers/cromwell/requirements.txt /app/jobs

RUN cd jobs && pip install -r requirements.txt
# We installed jm_utils so don't need local copy anymore, which breaks imports
RUN rm -rf jm_utils

# Missing required arguments -b PORT, -e ... which must be provided by the
# docker image user.
ENTRYPOINT ["gunicorn", "jobs:run()"]
