# Deploy Job Manager against Cromwell with docker-compose

1. Prepare the config files following the [main instructions](../../README.md), based on your requirements.

2. Make sure your network settings are correct, e.g. DNS, TLS certs.

3. Make sure you are in the same directory of where the file `cromwell-compose-template.yml` is hosted.

4. Start Job Manager with `docker-compose -f cromwell-compose-template.yml up`.

5. Stop the server with `docker-compose -f cromwell-compose-template.yml down`.

Note: for dependency changes or updates, you can rebuild with docker-compose using 
  `docker-compose -f cromwell-compose-template.yml build (--no-cache)`.
