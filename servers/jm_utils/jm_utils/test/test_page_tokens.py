# coding: utf-8

from __future__ import absolute_import

import datetime
import unittest

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
        self.assertIn('Invalid offset must integer > 0', str(
            context.exception))

    def test_decode_offset_zero(self):
        encoded = page_tokens._encode({'of': 0})
        with self.assertRaises(ValueError) as context:
            page_tokens.decode_offset(encoded)
        self.assertIn('Invalid offset token JSON', str(context.exception))

    def test_decode_offset_none(self):
        self.assertEqual(page_tokens.decode_offset(None), None)

    def test_encode_decode_created_before(self):
        now = datetime.datetime.now().replace(microsecond=0)
        encoded = page_tokens.encode_created_before(now, 'offset-id')
        decoded_create_time, decoded_offset_id = page_tokens.decode_created_before(
            encoded)
        self.assertEqual(decoded_create_time, now)
        self.assertEqual(decoded_offset_id, 'offset-id')

    def test_encode_created_before_invalid(self):
        with self.assertRaises(ValueError) as context:
            page_tokens.encode_created_before('not-a-date')
        self.assertIn('Invalid create time must be datetime',
                      str(context.exception))
        with self.assertRaises(ValueError) as context:
            page_tokens.encode_created_before(datetime.datetime.now(), 123)
        self.assertIn('Invalid offset id must be string', str(
            context.exception))

    def test_decode_created_before_invalid(self):
        encoded = page_tokens._encode({'cb': 'not-a-date'})
        with self.assertRaises(ValueError) as context:
            page_tokens.decode_created_before(encoded)
        self.assertIn('Invalid created before in token JSON',
                      str(context.exception))
        encoded = page_tokens._encode({'cb': 10, 'oi': 123})
        with self.assertRaises(ValueError) as context:
            page_tokens.decode_created_before(encoded)
        self.assertIn('Invalid offset ID in token JSON', str(
            context.exception))

    def test_decode_created_before_none(self):
        self.assertEqual(page_tokens.decode_created_before(None), None)


if __name__ == '__main__':
    unittest.main()
