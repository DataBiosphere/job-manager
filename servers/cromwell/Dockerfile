FROM gcr.io/google-appengine/python

WORKDIR /app

ADD servers/cromwell/requirements.txt /app/

RUN pip install -r requirements.txt

ADD servers/cromwell/jobs /app/jobs

EXPOSE 8080

ENTRYPOINT ["python"]

CMD ["-m", "jobs"]