import {async, TestBed} from "@angular/core/testing";
import {URLSearchParamsUtils} from "./url-search-params.utils";
import {JobStatus} from "../model/JobStatus";
import {QueryJobsRequest} from "../model/QueryJobsRequest";

const queryRequest: QueryJobsRequest = {
  name: 'job-name',
  statuses: [JobStatus.Running, JobStatus.Aborted],
  labels: {'key': 'value'},
  extensions: {
    projectId: 'project-id'
  }
};
const queryRequestString: string = 'statuses=Running&statuses=Aborted&name=job-name&projectId=project-id&key=value';

const queryMap:  Map<String, String[]> = new Map()
  .set('name', ['job-name'])
  .set('statuses', ['Running', 'Aborted'])
  .set('key', ['value'])
  .set('projectId', ['project-id']);

const queryMapString: string = 'name=job-name&statuses=Running&statuses=Aborted&key=value&projectId=project-id';

describe('URLSearchParamsUtils', () => {
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [

      ],
      providers: [

      ]
    }).compileComponents();
  }));

  it('should encode query string from request', () => {
      expect(URLSearchParamsUtils.encodeURLSearchParams(queryRequest)).toBe(queryRequestString);
    });

  it('should encode query string from map', () => {
    expect(URLSearchParamsUtils.encodeURLSearchParamsFromMap(queryMap)).toBe(queryMapString);
  });

  it('should decode request from query string', () => {
    let actualRequest: QueryJobsRequest = URLSearchParamsUtils.unpackURLSearchParams(queryRequestString);
    expect(actualRequest.extensions.projectId).toBe(queryRequest.extensions.projectId);
    expect(actualRequest.name).toBe(queryRequest.name);
    expect(actualRequest.statuses.toString()).toBe(queryRequest.statuses.toString());
    expect(actualRequest.labels['key']).toBe(queryRequest.labels['key']);
  });

  it('should get list of chips', () => {
    let chips: Map<string, string> = URLSearchParamsUtils.getChips(queryMapString);
    chips.forEach((value: string, key: string) => {
      expect(value).toBe(queryMap.get(key).toString());
    });
  });
});
