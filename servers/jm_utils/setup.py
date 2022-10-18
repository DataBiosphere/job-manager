# coding: utf-8

from setuptools import setup, find_packages

NAME = "jm_utils"
VERSION = "1.0.0"

# To install the library, run the following
#
# python3 install
#
# prerequisite: setuptools
# http://pypi.python.org/pypi/setuptools

REQUIRES = ['pytz']

setup(
    name=NAME,
    version=VERSION,
    description="Utilities for Job Manager backends",
    author_email="",
    url="",
    keywords=["Swagger", "Job Manager Service"],
    install_requires=REQUIRES,
    packages=find_packages(),
    include_package_data=True,
    long_description="""\
    Utilities needed by multiple Job Manager backends.
    """
)
