# Deploy Job Manager against dsub with docker-compose

1. Prepare the config files following the [main instructions](../../README.md), based on your requirements.

2. Make sure your network settings are correct, e.g. DNS, TLS certs.

3. Make sure the `dsub` CLI is working properly, (check  for
 [here](https://github.com/googlegenomics/dsub#getting-started) setup instructions)

4. Make sure you are in the same directory of where the file `dsub-compose-template.yml` is hosted.

5. Start Job Manager with `docker-compose -f dsub-compose-template.yml up`.

6. Stop the server with `docker-compose -f dsub-compose-template.yml down`.

Note: for dependency changes or updates, you can rebuild with docker-compose using 
  `docker-compose -f dsub-compose-template.yml build --no-cache`
