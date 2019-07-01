#!/bin/sh

set +e
python_files_command="git diff 4b825dc642cb6eb9a060e54bf8d69288fbee4904 --name-only | grep '\.py$' | grep -v 'servers/[^\/]*/jobs/models' | grep -v 'setup.py'"
python_files=$(eval $python_files_command)
yapf_out=$(eval yapf -d $python_files || :)
if [ -z "$yapf_out" ]; then
  echo "Passed yapf linter!"
  exit 0
else
	echo "Failed yapf linter, the following commands will lint all python files:"
	echo "pip install yapf # First-time only"
	echo "yapf -i \$($python_files_command)"
  echo
  echo "Full lint output:"
  echo "${yapf_out}"
	exit 1
fi

