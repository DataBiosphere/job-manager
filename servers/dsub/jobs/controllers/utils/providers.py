from dsub.providers import google, google_v2, local, stub
from dsub.lib import resources
from flask import current_app
from werkzeug.exceptions import BadRequest, Unauthorized, NotImplemented
from oauth2client.client import AccessTokenCredentials, AccessTokenCredentialsError
import requests

from jobs.common import enum

ProviderType = enum(GOOGLE='google',
                    GOOGLE_V2='google-v2',
                    LOCAL='local',
                    STUB='stub')


def get_provider(provider_type, project_id=None, auth_token=None):
    """Construct the dsub provider for the given parameters.

        Args:
            provider_type: A string indicating google, local, or stub provider
            project_id: A string representing a Google Cloud Project ID
            auth_token: oauth2 token for authorizing Genomics API requests in
                dsub

        Returns:
            JobProvider: Instance of LocalJobProvider, GoogleJobProvider, or
                StubJobProvider.
    """
    if provider_type in [ProviderType.GOOGLE, ProviderType.GOOGLE_V2]:
        return _get_google_provider(project_id, auth_token, provider_type)
    elif project_id or auth_token:
        raise BadRequest(
            'The Local provider does not support the `{}` field .'.format(
                'authToken' if auth_token else 'parentId'))
    elif provider_type == ProviderType.LOCAL:
        # TODO(https://github.com/googlegenomics/dsub/issues/93): Remove
        # resources parameter and import
        return local.LocalJobProvider(resources)
    elif provider_type == ProviderType.STUB:
        return stub.StubJobProvider()


def _get_google_provider(project_id, auth_token, provider_type):
    if not project_id:
        raise BadRequest('Missing required field `extensions.projectId`.')
    if not auth_token:
        if _requires_auth():
            raise BadRequest('Missing required field `authToken`.')
        return google.GoogleJobProvider(False, False, project_id)

    resp = requests.post('https://www.googleapis.com/oauth2/v2/tokeninfo',
                         params={
                             'access_token': auth_token,
                         })
    if resp.status_code != 200:
        raise Unauthorized('failed to validate auth token')
    current_app.logger.info('user "%s" signed in', resp.json().get('email'))

    try:
        credentials = AccessTokenCredentials(auth_token, 'user-agent')
        if provider_type == ProviderType.GOOGLE:
            return google.GoogleJobProvider(False,
                                            False,
                                            project_id,
                                            credentials=credentials)
        else:
            return google_v2.GoogleV2JobProvider(False,
                                                 False,
                                                 project_id,
                                                 credentials=credentials)
    except AccessTokenCredentialsError as e:
        raise Unauthorized('Invalid authentication token:{}.'.format(e))


def _requires_auth():
    return current_app.config['REQUIRES_AUTH']
