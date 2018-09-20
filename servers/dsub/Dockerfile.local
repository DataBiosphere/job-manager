# Note: This is the dockerfile for development purposes

FROM gcr.io/google-appengine/python
RUN virtualenv --no-download /env -p python

# Set virtualenv environment variables. This is equivalent to running
# source /env/bin/activate
ENV VIRTUAL_ENV /env
ENV PATH /env/bin:$PATH

WORKDIR /app
ADD jm_utils /app/jm_utils
ADD dsub/jobs /app/jobs
ADD dsub/requirements.txt /app/jobs
RUN cd jobs && pip install -r requirements.txt
# We installed jm_utils so don't need local copy anymore, which breaks imports
RUN rm -rf jm_utils

# Install docker-ce for dsub local provider
RUN apt-get update
RUN echo 'debconf debconf/frontend select Noninteractive' | debconf-set-selections
RUN apt-get install -y --no-install-recommends apt-utils
RUN apt-get install -y apt-utils apt-transport-https ca-certificates curl gnupg2 software-properties-common
RUN curl -fsSL https://download.docker.com/linux/$(. /etc/os-release; echo "$ID")/gpg | apt-key add -
RUN add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/$(. /etc/os-release; echo "$ID") $(lsb_release -cs) stable"
RUN apt-get update
RUN apt-get install -y docker-ce

# Missing required arguments -b PORT, -e ... which must be provided by the
# docker image user.
ENTRYPOINT ["/bin/bash", "/scripts/await_md5_match.sh", "/app/jobs/models/.jobs.yaml.md5", "--", "/env/bin/gunicorn", "jobs.__main__:app"]
