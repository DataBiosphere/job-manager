# coding: utf-8

from __future__ import absolute_import
from jobs.models.query_jobs_result import QueryJobsResult
from .base_model_ import Model
from datetime import date, datetime
from typing import List, Dict
from ..util import deserialize_model


class QueryJobsResponse(Model):
    """
    NOTE: This class is auto generated by the swagger code generator program.
    Do not edit the class manually.
    """
    def __init__(self, results=None, total_known_results=None, next_page_token=None):
        """
        QueryJobsResponse - a model defined in Swagger

        :param results: The results of this QueryJobsResponse.
        :type results: List[QueryJobsResult]
        :param total_known_results: The total_known_results of this QueryJobsResponse.
        :type total_known_results: float
        :param next_page_token: The next_page_token of this QueryJobsResponse.
        :type next_page_token: str
        """
        self.swagger_types = {
            'results': List[QueryJobsResult],
            'total_known_results': float,
            'next_page_token': str
        }

        self.attribute_map = {
            'results': 'results',
            'total_known_results': 'totalKnownResults',
            'next_page_token': 'nextPageToken'
        }

        self._results = results
        self._total_known_results = total_known_results
        self._next_page_token = next_page_token

    @classmethod
    def from_dict(cls, dikt):
        """
        Returns the dict as a model

        :param dikt: A dict.
        :type: dict
        :return: The QueryJobsResponse of this QueryJobsResponse.
        :rtype: QueryJobsResponse
        """
        return deserialize_model(dikt, cls)

    @property
    def results(self):
        """
        Gets the results of this QueryJobsResponse.

        :return: The results of this QueryJobsResponse.
        :rtype: List[QueryJobsResult]
        """
        return self._results

    @results.setter
    def results(self, results):
        """
        Sets the results of this QueryJobsResponse.

        :param results: The results of this QueryJobsResponse.
        :type results: List[QueryJobsResult]
        """
        if results is None:
            raise ValueError("Invalid value for `results`, must not be `None`")

        self._results = results

    @property
    def total_known_results(self):
        """
        Gets the total_known_results of this QueryJobsResponse.
        The total number of results which matched the query. Can be empty if the backend cannot calculate this total.

        :return: The total_known_results of this QueryJobsResponse.
        :rtype: float
        """
        return self._total_known_results

    @total_known_results.setter
    def total_known_results(self, total_known_results):
        """
        Sets the total_known_results of this QueryJobsResponse.
        The total number of results which matched the query. Can be empty if the backend cannot calculate this total.

        :param total_known_results: The total_known_results of this QueryJobsResponse.
        :type total_known_results: float
        """

        self._total_known_results = total_known_results

    @property
    def next_page_token(self):
        """
        Gets the next_page_token of this QueryJobsResponse.
        The continuation token, which is used to page through large result sets. Provide this value in a subsequent request to return the next page of results. This field will be empty if there aren't any additional results. 

        :return: The next_page_token of this QueryJobsResponse.
        :rtype: str
        """
        return self._next_page_token

    @next_page_token.setter
    def next_page_token(self, next_page_token):
        """
        Sets the next_page_token of this QueryJobsResponse.
        The continuation token, which is used to page through large result sets. Provide this value in a subsequent request to return the next page of results. This field will be empty if there aren't any additional results. 

        :param next_page_token: The next_page_token of this QueryJobsResponse.
        :type next_page_token: str
        """

        self._next_page_token = next_page_token

