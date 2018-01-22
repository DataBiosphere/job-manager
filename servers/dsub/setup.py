# coding: utf-8

import sys
from setuptools import setup, find_packages

NAME = "jobs"
VERSION = "1.0.0"

# To install the library, run the following
#
# python setup.py install
#
# prerequisite: setuptools
# http://pypi.python.org/pypi/setuptools

REQUIRES = ["connexion"]

setup(
    name=NAME,
    version=VERSION,
    description="Job Manager Service",
    author_email="",
    url="",
    keywords=["Swagger", "Job Manager Service"],
    install_requires=REQUIRES,
    packages=find_packages(),
    package_data={'': ['swagger/swagger.yaml']},
    include_package_data=True,
    long_description="""\
    Job Manager API for interacting with asynchronous batch jobs and workflows.
    """
)

