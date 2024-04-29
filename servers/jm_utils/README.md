# Job Manager Utilities

The `jm-utils` package contains common code used by both the cromwell and (now deprecated and removed) dsub backends.

## Installing
To make jm_utils available for import, backends in the servers directory should
add the following line to their `requirements-to-freeze.txt`:
```
../jm_utils
```

By default, `pip freeze` will convert this line to `jm_utils=x.y.z` in the
`requirements.txt`, but this causes problems when trying to `pip install` the
requirements, so you should convert it back to ../jm_utils.

You can do this using `sed` in conjunction with `pip freeze`, like this:
`pip freeze | sed 's/^jm-utils.*/\.\.\/jm_utils/g' > servers/my_server/requirements.txt`

Then, in the backend's Dockerfile, add this line:
```
ADD servers/jm_utils /app/jm_utils
```

When running in the resulting Docker container, you can import and use jm_utils
modules like this:
```
from jm_utils import page_tokens
encoded_token = page_tokens.encode(35)
```

## Running Tests
To run unit tests, install
[`tox`](https://github.com/tox-dev/tox).
```
cd servers/jm_utils
tox -- -s
```
