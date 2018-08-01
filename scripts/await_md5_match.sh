#!/bin/bash

while [ $# -gt 0 ]
do
  case $1 in
    --)
    shift 1
    break
    ;;
    *)
    MD5SUMFILES="$1 $MD5SUMFILES"
    shift 1
  esac
done

echo "checking md5sum --quiet -c $MD5SUMFILES"

while ! md5sum --quiet -c $MD5SUMFILES &>/dev/null
do
  sleep 1
  echo "Waiting for swagger rebuild..."
done

echo "Ready to run: $@"
exec "$@"
