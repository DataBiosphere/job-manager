FROM java
ADD api/ /api/
ADD servers/cromwell/ /servers/cromwell/
RUN wget http://central.maven.org/maven2/io/swagger/swagger-codegen-cli/2.2.3/swagger-codegen-cli-2.2.3.jar -O swagger-codegen-cli.jar
RUN java -jar swagger-codegen-cli.jar generate \
  -i /api/jobs.yaml \
  -l python-flask \
  -o /servers/cromwell \
  -DsupportPython2=true,packageName=jobs
FROM gcr.io/google-appengine/python

WORKDIR /app
COPY --from=0 /servers/cromwell/jobs/models/* /app/jobs/models/
ADD servers/jm_utils /app/jm_utils
ADD servers/cromwell/jobs /app/jobs
COPY servers/cromwell/requirements.txt /app/jobs
RUN cd jobs && pip install -r requirements.txt
# We installed jm_utils so don't need local copy anymore, which breaks imports
RUN rm -rf jm_utils

# Missing required arguments -b PORT, -e ... which must be provided by the
# docker image user.
ENTRYPOINT ["gunicorn", "jobs:run()"]
