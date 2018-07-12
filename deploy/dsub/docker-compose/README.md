# Deploy Job Manager against Cromwell with docker-compose

1. Prepare the config files following the instructions, based on your requirements.

2. Make sure your network settings are correct, e.g. DNS, TLS certs.

3. Make sure the `dsub` CLI is working properly, (check  for
 [here](https://github.com/googlegenomics/dsub#getting-started) setup instructions)

4. Start Job Manager with `docker-compose -f dsub-compose-template.yml up`.

5. Stop the server with `docker-compose -f dsub-compose-template.yml down`.
