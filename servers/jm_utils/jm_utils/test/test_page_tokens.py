# coding: utf-8

from __future__ import absolute_import

import datetime
import unittest
import pytz

from .. import page_tokens


class TestJmUtils(unittest.TestCase):
    """ jm_utils unit tests """
    def test_encode_decode_offset(self):
        encoded = page_tokens.encode_offset(12)
        decoded = page_tokens.decode_offset(encoded)
        self.assertEqual(decoded, 12)

    def test_encode_offset_zero(self):
        with self.assertRaises(ValueError) as context:
            page_tokens.encode_offset(0)
        self.assertIn('Invalid offset must integer > 0',
                      str(context.exception))

    def test_decode_offset_zero(self):
        encoded = page_tokens._encode({'of': 0})
        with self.assertRaises(ValueError) as context:
            page_tokens.decode_offset(encoded)
        self.assertIn('Invalid offset token JSON', str(context.exception))

    def test_decode_offset_none(self):
        self.assertEqual(page_tokens.decode_offset(None), None)

    def test_encode_decode_create_time_max(self):
        now = datetime.datetime.now().replace(microsecond=0).replace(
            tzinfo=pytz.utc)
        encoded = page_tokens.encode_create_time_max(now, 'offset-id')
        decoded_create_time, decoded_offset_id = page_tokens.decode_create_time_max(
            encoded)
        self.assertEqual(decoded_create_time, now)
        self.assertEqual(decoded_offset_id, 'offset-id')

    def test_encode_create_time_max_invalid(self):
        with self.assertRaises(ValueError) as context:
            page_tokens.encode_create_time_max('not-a-date')
        self.assertIn('Invalid create time must be datetime',
                      str(context.exception))
        with self.assertRaises(ValueError) as context:
            page_tokens.encode_create_time_max(datetime.datetime.now(), 123)
        self.assertIn('Invalid offset id must be string',
                      str(context.exception))

    def test_decode_create_time_max_invalid(self):
        encoded = page_tokens._encode({'cb': 'not-a-date'})
        with self.assertRaises(ValueError) as context:
            page_tokens.decode_create_time_max(encoded)
        self.assertIn('Invalid created before in token JSON',
                      str(context.exception))
        encoded = page_tokens._encode({'cb': 10, 'oi': 123})
        with self.assertRaises(ValueError) as context:
            page_tokens.decode_create_time_max(encoded)
        self.assertIn('Invalid offset ID in token JSON',
                      str(context.exception))

    def test_decode_create_time_max_none(self):
        self.assertEqual(page_tokens.decode_create_time_max(None), None)


if __name__ == '__main__':
    unittest.main()
