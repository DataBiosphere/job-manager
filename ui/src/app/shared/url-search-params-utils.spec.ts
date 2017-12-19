import {async, TestBed} from "@angular/core/testing";
import {URLSearchParamsUtils} from "./url-search-params.utils";
import {JobStatus} from "./model/JobStatus";
import {QueryJobsRequest} from "./model/QueryJobsRequest";

const queryRequest: QueryJobsRequest = {
  parentId: 'parent-id',
  name: 'name',
  statuses: [JobStatus.Running, JobStatus.Aborted],
  labels: new Map().set('key', 'value')
};

const queryMap:  Map<String, String[]> = new Map()
  .set('parent-id', ['parent-id'])
  .set('job-name', ['name'])
  .set('statuses', ['Running', 'Aborted'])
  .set('key', ['value']);

const queryString: string = 'parent-id=parent-id&job-name=name&statuses=Running&statuses=Aborted&key=value';

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
      expect(URLSearchParamsUtils.encodeURLSearchParams(queryRequest)).toBe(queryString);
    });

  it('should encode query string from map', () => {
    expect(URLSearchParamsUtils.encodeURLSearchParamsFromMap(queryMap)).toBe(queryString);
  });

  it('should decode request from query string', () => {
    let actualRequest: QueryJobsRequest = URLSearchParamsUtils.unpackURLSearchParams(queryString);
    expect(actualRequest.parentId).toBe(queryRequest.parentId);
    expect(actualRequest.name).toBe(queryRequest.name);
    expect(actualRequest.statuses.toString()).toBe(queryRequest.statuses.toString());
    expect((<Map<string, string>> actualRequest.labels).size)
      .toBe((<Map<string, string>> queryRequest.labels).size);
    expect((<Map<string, string>> actualRequest.labels).get('key'))
      .toBe((<Map<string, string>> queryRequest.labels).get('key'));
  });

  it('should get list of chips', () => {
    let chips: Map<string, string> = URLSearchParamsUtils.getChips(queryString);
    chips.forEach((value: string, key: string) => {
      expect(value).toBe(queryMap.get(key).toString());
    });
  });
});
