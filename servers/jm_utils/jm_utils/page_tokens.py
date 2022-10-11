"""
We implement the pagination token via base64-encoded JSON s.t. tokens are
opaque to clients and enable us to make backwards compatible changes to our
pagination implementation. Base64+JSON are used specifically as they are
easily portable across language.
"""
import base64
import datetime
import json
import numbers

import pytz


def _encode(dictionary):
    """Encodes any arbitrary dictionary into a pagination token.

    Args:
        dictionary: (dict) Dictionary to basee64-encode

    Returns:
        (string) encoded page token representing a page of items
    """
    # Strip ugly base64 padding.
    byteStr = bytearray(json.dumps(dictionary).encode())
    encodedStr = base64.urlsafe_b64encode(byteStr)
    return encodedStr.rstrip('='.encode())


def _decode(token):
    """Decodes the pagination token.

    Args:
        token: (string) Base64 encoded JSON pagination token

    Returns:
        (dict) The token dictionary representing a page of items.
    """
    if token is None:
        return None
    # Pad the token out to be divisible by 4.
    padded_token = token + '='.encode() * (4 - (len(token) % 4))
    decoded_token = base64.urlsafe_b64decode(padded_token)
    token_dict = json.loads(decoded_token)
    if not token_dict or not isinstance(token_dict, dict):
        raise ValueError('Invalid pagination token: {}').format(token_dict)
    return token_dict


def encode_offset(offset):
    """Encodes an offset integer into a pagination token.

    Args:
      offset: (int) index into the overall list of items matching the query

    Returns:
      (string) encoded page token representing a page of items.
    """
    if offset is None:
        return None

    if not isinstance(offset, numbers.Number) or offset <= 0:
        raise ValueError('Invalid offset must integer > 0: {}'.format(offset))
    return _encode({"of": offset})


def encode_create_time_max(create_time_max, offset_id=None):
    """Encodes a create_time_max and optional offset ID into a pagination token.

    Args:
      create_time_max: (datetime) The create-time of the first item to include in the associated page.
      offset_id: (str) The unique ID of the first item to include in the associated page. Needed
        only if the previous page ends with an item containing the same create-time.

    Returns:
      (string) encoded page token representing a page of items.
    """
    if create_time_max is None:
        return None

    if not isinstance(create_time_max, datetime.datetime):
        raise ValueError(
            'Invalid create time must be datetime: {}'.format(create_time_max))
    if offset_id and not isinstance(offset_id, (str, bytes)):
        raise ValueError(
            'Invalid offset id must be string: {}'.format(offset_id))

    epoch = datetime.datetime.utcfromtimestamp(0).replace(tzinfo=pytz.utc)
    seconds_epoch = int((create_time_max - epoch).total_seconds())
    token_dict = {'cb': seconds_epoch}
    if offset_id:
        token_dict['oi'] = offset_id
    return _encode(token_dict)


def decode_offset(token):
    """Decodes the offset-pagination token.

    Args:
        token: (string) base64 encoded JSON offset-pagination token

    Returns:
        (number) the pagination offset, defaults to None if token is None
    """
    token_dict = _decode(token)
    if token_dict is None:
        return None

    offset = token_dict.get('of')
    if not offset or not isinstance(offset, numbers.Number) or offset <= 0:
        raise ValueError('Invalid offset token JSON: {}'.format(token_dict))
    return offset


def decode_create_time_max(token):
    """Decode a create_time_max and optional offset ID pagination token.

    Args:
        token: (string) base64 encoded JSON offset-pagination token

    Returns:
        (datetime, str) A tuple of create_time_max, offset_id, defaults to
            None if token is None. create_time_max is the create-time of the
            first item to include in this page. If present, offset_id is a
            unique ID of the first item to include in this page.
    """
    token_dict = _decode(token)
    if token_dict is None:
        return None

    create_time_max = token_dict.get('cb')
    offset_id = token_dict.get('oi')

    if create_time_max and isinstance(create_time_max, numbers.Number):
        create_time_max = datetime.datetime.utcfromtimestamp(
            create_time_max).replace(tzinfo=pytz.utc)
    else:
        raise ValueError(
            'Invalid created before in token JSON: {}'.format(token_dict))

    if offset_id and not isinstance(offset_id, (str, bytes)):
        raise ValueError(
            'Invalid offset ID in token JSON: {}'.format(token_dict))

    return create_time_max, offset_id
