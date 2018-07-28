FROM java
ADD api/ /api/
ADD servers/cromwell/ /servers/cromwell/
RUN wget http://central.maven.org/maven2/io/swagger/swagger-codegen-cli/2.2.3/swagger-codegen-cli-2.2.3.jar -O swagger-codegen-cli.jar
RUN java -jar swagger-codegen-cli.jar generate \
  -i api/jobs.yaml \
  -l python-flask \
  -o servers/dsub \
  -DsupportPython2=true,packageName=jobs

FROM gcr.io/google-appengine/python
RUN virtualenv --no-download /env -p python

# Set virtualenv environment variables. This is equivalent to running
# source /env/bin/activate
ENV VIRTUAL_ENV /env
ENV PATH /env/bin:$PATH

WORKDIR /app
COPY --from=0 /servers/dsub/jobs/models /app/jobs/models
ADD jm_utils /app/jm_utils
ADD dsub/jobs /app/jobs
ADD dsub/requirements.txt /app/jobs
RUN cd jobs && pip install -r requirements.txt
# We installed jm_utils so don't need local copy anymore, which breaks imports
RUN rm -rf jm_utils

# Missing required arguments -b PORT, -e ... which must be provided by the
# docker image user.
ENTRYPOINT ["/bin/bash", "/scripts/await_md5_match.sh", "/app/jobs/.jobs.yaml.md5", "--", "/env/bin/gunicorn", "jobs.__main__:app"]
