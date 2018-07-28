#!/bin/bash

set -e

if [[ ! -d "ui" ]] 
then
  echo "Cannot find expected directory 'ui'. Did you run the rebuild script from somewhere unexpected?" >&2 
  echo "You must run this script from the base of the job-manager directory like '. scripts/rebuild_swagger.sh'" >&2 
  exit 1 
fi

if [[ ! -e "swagger-codegen-cli.jar" ]]
then
  if [[ -e "$(command -v wget)" ]]; then
    wget http://central.maven.org/maven2/io/swagger/swagger-codegen-cli/2.2.3/swagger-codegen-cli-2.2.3.jar -O swagger-codegen-cli.jar
  elif [[ -e "$(command -v curl)" ]]; then
    curl http://central.maven.org/maven2/io/swagger/swagger-codegen-cli/2.2.3/swagger-codegen-cli-2.2.3.jar > swagger-codegen-cli.jar
  else
    "Cannot download 'http://central.maven.org/maven2/io/swagger/swagger-codegen-cli/2.2.3/swagger-codegen-cli-2.2.3.jar' automatically (no curl or wget found on PATH)"
    "You can download it manually into this directory to continue"
    exit 1
  fi
fi

if [[ -d "ui/src/app/shared/model" ]]
then
  rm -r ui/src/app/shared/model
fi

if [[ -d "servers/dsub/jobs/models" ]]
then
  rm -r servers/dsub/jobs/models
fi

if [[ -d "servers/cromwell/jobs/models" ]]
then
  rm -r servers/cromwell/jobs/models
fi

MD5=$(md5sum api/jobs.yaml | awk ' { print $1 }' )
MD5="$MD5 /api/jobs.yaml"

java -jar swagger-codegen-cli.jar generate \
  -i api/jobs.yaml \
  -l typescript-angular2 \
  -o ui/src/app/shared
echo $MD5 > ui/src/app/shared/model/.jobs.yaml.md5

java -jar swagger-codegen-cli.jar generate \
  -i api/jobs.yaml \
  -l python-flask \
  -o servers/dsub \
  -DsupportPython2=true,packageName=jobs
echo $MD5 > servers/dsub/jobs/models/.jobs.yaml.md5

java -jar swagger-codegen-cli.jar generate \
  -i api/jobs.yaml \
  -l python-flask \
  -o servers/cromwell \
  -DsupportPython2=true,packageName=jobs
echo $MD5 > servers/cromwell/jobs/models/.jobs.yaml.md5

echo "Done!"
