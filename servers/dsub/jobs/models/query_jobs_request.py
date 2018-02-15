# coding: utf-8

from __future__ import absolute_import
from jobs.models.extended_query_fields import ExtendedQueryFields
from jobs.models.job_status import JobStatus
import re
from .base_model_ import Model
from datetime import date, datetime
from typing import List, Dict
from ..util import deserialize_model


class QueryJobsRequest(Model):
    """
    NOTE: This class is auto generated by the swagger code generator program.
    Do not edit the class manually.
    """
    def __init__(self, start=None, end=None, statuses=None, labels=None, name=None, page_size=None, page_token=None, extensions=None):
        """
        QueryJobsRequest - a model defined in Swagger

        :param start: The start of this QueryJobsRequest.
        :type start: datetime
        :param end: The end of this QueryJobsRequest.
        :type end: datetime
        :param statuses: The statuses of this QueryJobsRequest.
        :type statuses: List[JobStatus]
        :param labels: The labels of this QueryJobsRequest.
        :type labels: object
        :param name: The name of this QueryJobsRequest.
        :type name: str
        :param page_size: The page_size of this QueryJobsRequest.
        :type page_size: int
        :param page_token: The page_token of this QueryJobsRequest.
        :type page_token: str
        :param extensions: The extensions of this QueryJobsRequest.
        :type extensions: ExtendedQueryFields
        """
        self.swagger_types = {
            'start': datetime,
            'end': datetime,
            'statuses': List[JobStatus],
            'labels': object,
            'name': str,
            'page_size': int,
            'page_token': str,
            'extensions': ExtendedQueryFields
        }

        self.attribute_map = {
            'start': 'start',
            'end': 'end',
            'statuses': 'statuses',
            'labels': 'labels',
            'name': 'name',
            'page_size': 'pageSize',
            'page_token': 'pageToken',
            'extensions': 'extensions'
        }

        self._start = start
        self._end = end
        self._statuses = statuses
        self._labels = labels
        self._name = name
        self._page_size = page_size
        self._page_token = page_token
        self._extensions = extensions

    @classmethod
    def from_dict(cls, dikt):
        """
        Returns the dict as a model

        :param dikt: A dict.
        :type: dict
        :return: The QueryJobsRequest of this QueryJobsRequest.
        :rtype: QueryJobsRequest
        """
        return deserialize_model(dikt, cls)

    @property
    def start(self):
        """
        Gets the start of this QueryJobsRequest.
        Returns only jobs with an equal or later start datetime. If both start and end date are specified, start date must be before or equal to end date. 

        :return: The start of this QueryJobsRequest.
        :rtype: datetime
        """
        return self._start

    @start.setter
    def start(self, start):
        """
        Sets the start of this QueryJobsRequest.
        Returns only jobs with an equal or later start datetime. If both start and end date are specified, start date must be before or equal to end date. 

        :param start: The start of this QueryJobsRequest.
        :type start: datetime
        """

        self._start = start

    @property
    def end(self):
        """
        Gets the end of this QueryJobsRequest.
        Returns only jobs with an equal or earlier end datetime. If both start and end date are specified, start date must be before or equal to end date. 

        :return: The end of this QueryJobsRequest.
        :rtype: datetime
        """
        return self._end

    @end.setter
    def end(self, end):
        """
        Sets the end of this QueryJobsRequest.
        Returns only jobs with an equal or earlier end datetime. If both start and end date are specified, start date must be before or equal to end date. 

        :param end: The end of this QueryJobsRequest.
        :type end: datetime
        """

        self._end = end

    @property
    def statuses(self):
        """
        Gets the statuses of this QueryJobsRequest.
        If specified, returns only jobs matching any of these statuses. 

        :return: The statuses of this QueryJobsRequest.
        :rtype: List[JobStatus]
        """
        return self._statuses

    @statuses.setter
    def statuses(self, statuses):
        """
        Sets the statuses of this QueryJobsRequest.
        If specified, returns only jobs matching any of these statuses. 

        :param statuses: The statuses of this QueryJobsRequest.
        :type statuses: List[JobStatus]
        """

        self._statuses = statuses

    @property
    def labels(self):
        """
        Gets the labels of this QueryJobsRequest.
        If specified, returns only jobs containing labels with exact string matches to each of these labels. 

        :return: The labels of this QueryJobsRequest.
        :rtype: object
        """
        return self._labels

    @labels.setter
    def labels(self, labels):
        """
        Sets the labels of this QueryJobsRequest.
        If specified, returns only jobs containing labels with exact string matches to each of these labels. 

        :param labels: The labels of this QueryJobsRequest.
        :type labels: object
        """

        self._labels = labels

    @property
    def name(self):
        """
        Gets the name of this QueryJobsRequest.
        Returns only jobs with the specified name. 

        :return: The name of this QueryJobsRequest.
        :rtype: str
        """
        return self._name

    @name.setter
    def name(self, name):
        """
        Sets the name of this QueryJobsRequest.
        Returns only jobs with the specified name. 

        :param name: The name of this QueryJobsRequest.
        :type name: str
        """
        if name is not None and not re.search('^[a-zA-Z][a-zA-Z0-9_-]*$', name):
            raise ValueError("Invalid value for `name`, must be a follow pattern or equal to `/^[a-zA-Z][a-zA-Z0-9_-]*$/`")

        self._name = name

    @property
    def page_size(self):
        """
        Gets the page_size of this QueryJobsRequest.
        The maximum number of results to return in a single page. If unspecified, a server default will be used. Note that the server may elect to return fewer results per page than requested. 

        :return: The page_size of this QueryJobsRequest.
        :rtype: int
        """
        return self._page_size

    @page_size.setter
    def page_size(self, page_size):
        """
        Sets the page_size of this QueryJobsRequest.
        The maximum number of results to return in a single page. If unspecified, a server default will be used. Note that the server may elect to return fewer results per page than requested. 

        :param page_size: The page_size of this QueryJobsRequest.
        :type page_size: int
        """

        self._page_size = page_size

    @property
    def page_token(self):
        """
        Gets the page_token of this QueryJobsRequest.
        The continuation token, which is used to page through large result sets. To get the next page of results, set this parameter to the value of `nextPageToken` from the previous response. 

        :return: The page_token of this QueryJobsRequest.
        :rtype: str
        """
        return self._page_token

    @page_token.setter
    def page_token(self, page_token):
        """
        Sets the page_token of this QueryJobsRequest.
        The continuation token, which is used to page through large result sets. To get the next page of results, set this parameter to the value of `nextPageToken` from the previous response. 

        :param page_token: The page_token of this QueryJobsRequest.
        :type page_token: str
        """

        self._page_token = page_token

    @property
    def extensions(self):
        """
        Gets the extensions of this QueryJobsRequest.

        :return: The extensions of this QueryJobsRequest.
        :rtype: ExtendedQueryFields
        """
        return self._extensions

    @extensions.setter
    def extensions(self, extensions):
        """
        Sets the extensions of this QueryJobsRequest.

        :param extensions: The extensions of this QueryJobsRequest.
        :type extensions: ExtendedQueryFields
        """

        self._extensions = extensions

