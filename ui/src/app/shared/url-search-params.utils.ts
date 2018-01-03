import {URLSearchParams} from '@angular/http';

import {QueryJobsRequest} from "./model/QueryJobsRequest";
import {JobStatus} from "./model/JobStatus";
import {queryFields} from "./common";

/** Utilities for working with URLSearchParams*/
export class URLSearchParamsUtils {

  /** Accepts a QueryJobsRequest, and translates it reversibly into a string
   *  that can be passed as a QueryParam. */
  public static encodeURLSearchParams(request: QueryJobsRequest): string {
    let urlSearchParams = new URLSearchParams();
    urlSearchParams.set(queryFields.parentId, request.parentId);
    urlSearchParams.set(queryFields.jobName, request.name);
    for (let s in request.statuses) {
      urlSearchParams.append('statuses', JobStatus[request.statuses[s]]);
    }
    if (request.start) {
      urlSearchParams.set(queryFields.start, request.start.toISOString());
    }
    if (request.end) {
      urlSearchParams.set(queryFields.end, request.end.toISOString());
    }

    if (request.labels) {
      Object.keys((<{[index:string] : string }> request.labels)).forEach((key: string) => {
        urlSearchParams.set(key, request.labels[key]);
      });
    }
    return urlSearchParams.toString();
  }

  /** Accepts a param map, and translates it reversibly into a string that can
   *  be passed as a QueryParam. */
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

  /** Accepts a string query that was generated via encodeUrlSearchParams and
   *  converts it back into a QueryJobsRequest. */
  public static unpackURLSearchParams(query: string): QueryJobsRequest {
    let urlSearchParams = new URLSearchParams(query);
    let queryRequest = {
      labels: {},
    };

    urlSearchParams.paramsMap.forEach((values: string[], key: string) => {
      if (key == queryFields.parentId) {
        queryRequest['parentId'] = urlSearchParams.get(queryFields.parentId);
      }
      else if (key == queryFields.jobName) {
        queryRequest['name'] = urlSearchParams.get(queryFields.jobName);
      }
      else if (key == queryFields.statuses) {
        let statuses: JobStatus[] = [];
        for (let status of urlSearchParams.getAll(queryFields.statuses)) {
          statuses.push(JobStatus[status]);
        }
        queryRequest['statuses'] = statuses;
      }
      else if (key == queryFields.start) {
        queryRequest['start'] = new Date(urlSearchParams.get(queryFields.start));
      }
      else if (key == queryFields.end) {
        queryRequest['end'] = new Date(urlSearchParams.get(queryFields.end));
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
    for (let field in queryFields) {
      fields.push(queryFields[field]);
    }
    return fields;
  }
}
