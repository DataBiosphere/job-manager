from flask import current_app, request
from requests.auth import HTTPBasicAuth
from werkzeug.exceptions import Unauthorized


def requires_auth(fn):
    def wrapper(*args, **kwargs):
        auth_token = request.headers.get('Authentication')
        auth = _get_user_auth() if not auth_token else None
        headers = _get_auth_header(auth_token)
        if not auth_token and not auth:
            raise Unauthorized('User not authorized to access this resource.')
        kwargs['auth'] = auth
        kwargs['auth_token'] = auth_token
        kwargs['auth_headers'] = headers
        return fn(*args, **kwargs)

    return wrapper


def _get_user_auth():
    return HTTPBasicAuth(current_app.config['cromwell_user'],
                         current_app.config['cromwell_password'])


def _get_auth_header(auth_token):
    return {
        "Authorization": str(auth_token)
    } if current_app.config['use_caas'] and auth_token else None
