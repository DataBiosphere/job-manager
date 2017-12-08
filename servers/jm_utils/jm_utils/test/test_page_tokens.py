# coding: utf-8

from __future__ import absolute_import

import unittest

from .. import page_tokens


class TestJmUtils(unittest.TestCase):
    """ jm_utils unit tests """

    def setUp(self):
        self.base_url = 'https://test-cromwell.org'

    def test_encode_decode(self):
        encoded = page_tokens.encode(12)
        decoded = page_tokens.decode(encoded)
        self.assertEqual(decoded, 12)

    def test_encode_decode_zero(self):
        encoded = page_tokens.encode(0)
        with self.assertRaises(ValueError) as context:
            page_tokens.decode(encoded)
        self.assertIn('Invalid token', str(context.exception))

    def test_decode_none(self):
        self.assertEqual(page_tokens.decode(None), 0)


if __name__ == '__main__':
    unittest.main()
