FROM us.gcr.io/broad-dsp-gcr-public/base/jre:11-debian

WORKDIR /job-manager

ADD ./ /job-manager

RUN /bin/bash -c scripts/rebuild_swagger.sh

FROM us.gcr.io/broad-dsp-gcr-public/base/python:3.10-debian

WORKDIR /app

COPY --from=0 /job-manager/servers/jm_utils /app/jm_utils
COPY --from=0 /job-manager/servers/cromwell/jobs /app/jobs
COPY ./servers/cromwell/ /app/jobs
# Below is a link explaining where the individual PyYAML install command comes from
# https://github.com/yaml/pyyaml/issues/736#issuecomment-1653209769
# In short, due to Cython 3 being released, PyYAML needs to have it's Cython dependency contrained, otherwise it will fail to install due to deprecated features
# However installation of PyYAML uses a "wheel", which is basically a pre-compiled version of the package
# This is problematic for requirements.txt as it cannot specify a wheel, only a source package
# So we need to install PyYAML separately with the constraint defined in constraints.txt
RUN cd jobs && PIP_CONSTRAINT=constraints.txt pip install PyYAML==5.4.1
RUN cd jobs && pip install -r requirements.txt
# We installed jm_utils so don't need local copy anymore, which breaks imports
RUN rm -rf jm_utils

# Missing required arguments -b PORT, -e ... which must be provided by the
# docker image user.
ENTRYPOINT ["gunicorn", "jobs:run()"]
