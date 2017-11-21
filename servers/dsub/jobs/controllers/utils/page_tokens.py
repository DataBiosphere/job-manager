import base64
import json
import numbers


def encode_jobs_token(offset):
    """Encode the jobs pagination token.

    We implement the pagination token via base64-encoded JSON s.t. tokens are
    opaque to clients and enable us to make backwards compatible changes to our
    pagination implementation. Base64+JSON are used specifically as they are
    easily portable across language.

    Args:
      offset: (int) index into the overall list of jobs matching the query
    Returns:
      (string) encoded page token representing a page of jobs
    """
    s = json.dumps({
        'of': offset,
    })
    # Strip ugly base64 padding.
    return base64.urlsafe_b64encode(s).rstrip('=')


def decode_jobs_token(token):
    """Decode the jobs pagination token.

    Args:
      token: (string) base64 encoded JSON pagination token

    Returns:
      (number) the pagination offset
    """
    # Pad the token out to be divisible by 4.
    padded_token = token + '=' * (4 - (len(token) % 4))
    token = base64.urlsafe_b64decode(padded_token)
    token_dict = json.loads(token)
    offset = token_dict.get('of')
    if not offset or not isinstance(offset, numbers.Number) or offset <= 0:
        raise ValueError('Invalid token JSON {}'.format(token_dict))
    return offset
