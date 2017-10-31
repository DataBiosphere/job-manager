FROM gcr.io/google-appengine/python

WORKDIR /app

ADD servers/cromwell/requirements.txt /app/

RUN pip install -r requirements.txt

ADD servers/cromwell/jobs /app/jobs

# Missing required arguments -b PORT, -e ... which must be provided by the
# docker image user.
ENTRYPOINT ["gunicorn", "jobs.__main__:app"]
