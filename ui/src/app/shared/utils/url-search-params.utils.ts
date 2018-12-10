import {URLSearchParams} from '@angular/http';

import {CapabilitiesResponse} from "../model/CapabilitiesResponse";
import {QueryJobsRequest} from "../model/QueryJobsRequest";
import {JobStatus} from "../model/JobStatus";
import {FieldDataType, queryDataTypes, queryExtensionsDataTypes} from "../common";
import {TimeFrame} from "../model/TimeFrame";

/** Utilities for working with URLSearchParams*/
export class URLSearchParamsUtils {

  /** Accepts a QueryJobsRequest, and translates it reversibly into a string
   *  that can be passed as a QueryParam. */
  public static encodeURLSearchParams(request: QueryJobsRequest): string {
    let urlSearchParams = new URLSearchParams();

    for (let s in request.status) {
      urlSearchParams.append('status', JobStatus[request.status[s]]);
    }
    if (request.id) {
      urlSearchParams.set('id', request.id);
    }
    if (request.name) {
      urlSearchParams.set('name', request.name);
    }
    if (request.start) {
      urlSearchParams.set('start', request.start.toISOString());
    }
    if (request.end) {
      urlSearchParams.set('end', request.end.toISOString());
    }
    if (request.submission) {
      urlSearchParams.set('submission', request.submission.toISOString());
    }

    if (request.extensions) {
      if (request.extensions.projectId) {
        urlSearchParams.set('projectId', request.extensions.projectId);
      }
      if (request.extensions.userId) {
        urlSearchParams.set('userId', request.extensions.userId);
      }
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
      extensions: {}
    };

    urlSearchParams.paramsMap.forEach((values: string[], key: string) => {
      if (queryDataTypes.has(key) || queryExtensionsDataTypes.has(key)) {
        // If this is a known field, handle the data type explicitly
        var value: any;
        let dataType = queryDataTypes.has(key) ? queryDataTypes.get(key) : queryExtensionsDataTypes.get(key);
        switch (dataType) {
          case FieldDataType.Text: {
            value = urlSearchParams.get(key);
            break;
          }
          case FieldDataType.Date: {
            value = new Date(urlSearchParams.get(key));
            break;
          }
          case FieldDataType.Enum: {
            // Handle enum data types. Currently this is only statuses, if we
            // add additional ones this has to be updated.
            let statuses: JobStatus[] = [];
            for (let status of urlSearchParams.getAll(key)) {
              statuses.push(JobStatus[status]);
            }
            value = statuses;
          }
        }

        if (queryDataTypes.has(key)) {
          queryRequest[key] = value;
        } else {
          queryRequest.extensions[key] = value;
        }
      }
      else {
        // Assume that any filters not matching a primary field should be
        // interpreted as a text label.
        queryRequest.labels[key] = urlSearchParams.get(key);
      }
    });

    return queryRequest;
  }

  /** Get the start time by the given time frame on the dashboard page */
  public static getStartTimeByTimeFrame(timeFrame: TimeFrame): Date {
    const now = new Date;
    switch (timeFrame) {
      case TimeFrame.HOURS1:
        now.setHours(now.getHours() - 1);
        break;
      case TimeFrame.HOURS8:
        now.setHours(now.getHours() - 8);
        break;
      case TimeFrame.HOURS24:
        now.setDate(now.getDate() - 1);
        break;
      case TimeFrame.DAYS7:
        now.setDate(now.getDate() - 7);
        break;
      case TimeFrame.DAYS30:
        now.setDate(now.getDate() - 30);
        break;
      default:
        return null;
    }
    return now;
  }

  /** Transforms a search query into a map of (fieldName, value) pairs. */
  public static getChips(query: string): Map<string, string> {
    let urlSearchParams = new URLSearchParams(query);
    let chips: Map<string, string> = new Map();
    urlSearchParams.paramsMap.forEach((values: string[], key: string) => {
      if (values && key) {
        chips.set(decodeURIComponent(key), decodeURIComponent(values.toString()));
      }
    });
    return chips;
  }

  /** Returns the list of queryable fields. */
  public static getQueryFields(capabilities: CapabilitiesResponse): Map<string, FieldDataType>  {
    let queryFields = new Map<string, FieldDataType>(queryDataTypes);

    if (capabilities.commonLabels) {
      capabilities.commonLabels.forEach(label => {
        let currentField = capabilities.displayFields.find( f => f.field == 'labels.' + label);
        if (currentField && currentField.validFieldValues) {
          queryFields.set(label, FieldDataType.Enum);
        } else {
          queryFields.set(label, FieldDataType.Text);
        }
      });
    }

    if (capabilities.queryExtensions) {
      capabilities.queryExtensions.forEach(field => {
        if (!queryExtensionsDataTypes.has(field)) {
          throw new Error("Unsupported queryExtension field.")
        }
        if (queryExtensionsDataTypes.get(field) != FieldDataType.Boolean) {
          queryFields.set(field, queryExtensionsDataTypes.get(field));
        }
      });
    }
    return queryFields;
  }
}
