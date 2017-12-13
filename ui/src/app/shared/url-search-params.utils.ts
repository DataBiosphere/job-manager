import {URLSearchParams} from '@angular/http';

import {QueryJobsRequest} from "./model/QueryJobsRequest";
import {JobStatus} from "./model/JobStatus";
import {QueryFields} from "./common";

/** Utilities for working with URLSearchParams*/
export class URLSearchParamsUtils {

  /** Accepts a QueryJobsRequest, and translates it reversibly into a string that can be passed as a QueryParam. */
  public static encodeURLSearchParams(request: QueryJobsRequest): string {
    let urlSearchParams = new URLSearchParams();
    urlSearchParams.set(QueryFields.parentId, request.parentId);
    urlSearchParams.set(QueryFields.jobName, request.name);
    for (let s in request.statuses) {
      urlSearchParams.append('statuses', JobStatus[request.statuses[s]]);
    }
    if (request.start) {
      urlSearchParams.set(QueryFields.start, request.start.toISOString());
    }
    if (request.end) {
      urlSearchParams.set(QueryFields.end, request.end.toISOString());
    }

    if (request.labels) {
      urlSearchParams.set('user-id', request.labels['user-id']);
      urlSearchParams.set('status-detail', request.labels['status-detail']);
    }
    return urlSearchParams.toString();
  }

  /** Accepts a param map, and translates it reversibly into a string that can be passed as a QueryParam. */
  public static encodeURLSearchParamsFromMap(params: Map<String, String[]>): string {
    let urlSearchParams = new URLSearchParams();
    params.forEach((values: string[], key: string) => {
      if (values.length == 1) {
        urlSearchParams.set(key, values[0]);
      } else {
        values.forEach(value => urlSearchParams.append(key, value));
      }
    });
    return urlSearchParams.toString();
  }

  /** Accepts a string query that was generated via encodeUrlSearchParams and converts it back into a QueryJobsRequest. */
  public static unpackURLSearchParams(query: string): QueryJobsRequest {
    let urlSearchParams = new URLSearchParams(query);
    let queryRequest = {
      labels: {},
    };

    urlSearchParams.paramsMap.forEach((values: string[], key: string) => {
      if (key == QueryFields.parentId) {
        queryRequest['parentId'] = urlSearchParams.get(QueryFields.parentId);
      }
      else if (key == QueryFields.jobName) {
        queryRequest['name'] = urlSearchParams.get(QueryFields.jobName);
      }
      else if (key == QueryFields.statuses) {
        let statuses: JobStatus[] = [];
        for (let status of urlSearchParams.getAll(QueryFields.statuses)) {
          statuses.push(JobStatus[status]);
        }
      }
      else if (key == QueryFields.start) {
        queryRequest['start'] = new Date(urlSearchParams.get(QueryFields.start));
      }
      else if (key == QueryFields.end) {
        queryRequest['end'] = new Date(urlSearchParams.get(QueryFields.end));
      }
      // Assume that any filters not matching a primary field should be interpreted as a label
      else {
        queryRequest.labels[key] = urlSearchParams.get(key);
      }
    });


    return queryRequest;
  }

  /** Transforms a search query into a map of (fieldName, value) pairs. */
  public static getChips(query: string): Map<string, string> {
    let urlSearchParams = new URLSearchParams(query);
    let chips: Map<string, string> = new Map();
    urlSearchParams.paramsMap.forEach((values: string[], key: string) => {
      if (values && key) {
        chips.set(key, values.toString());
      }
    });
    return chips;
  }

  /** Returns the list of queryable non-label fields. */
  public static getQueryFields(): string[] {
    let fields: string[] = [];
    for (let field in QueryFields) {
      fields.push(QueryFields[field]);
    }
    return fields;
  }
}
