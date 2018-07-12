# Deploy Job Manager against Cromwell with docker-compose

1. Prepare the config files following the instructions, based on your requirements.

2. Make sure your network settings are correct, e.g. DNS, TLS certs.

3. Start Job Manager with `docker-compose -f cromwell-compose-template.yml up`.

4. Stop the server with `docker-compose -f cromwell-compose-template.yml down`.
