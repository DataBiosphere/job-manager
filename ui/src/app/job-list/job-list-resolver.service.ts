import {
  ActivatedRouteSnapshot,
  Router,
  Resolve,
  RouterStateSnapshot
} from '@angular/router';
import {Injectable} from '@angular/core';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/take';

import {JobManagerService} from '../core/job-manager.service';
import {initialBackendPageSize} from '../shared/common';
import {JobStream} from '../shared/job-stream';
import {RouteReuse} from '../route-reuse.service';

import {URLSearchParamsUtils} from "../shared/utils/url-search-params.utils";

@Injectable()
export class JobListResolver implements Resolve<JobStream> {
  constructor(
    private jobManagerService: JobManagerService,
    private router: Router,
    private routeReuse: RouteReuse,
  ) {}

  resolve(route: ActivatedRouteSnapshot,
          state: RouterStateSnapshot): Promise<JobStream> {
    // If this route has been cached do not wait for the load to display the
    // component. Instead, just mark the JobStream as needing a refresh.
    if (this.routeReuse.isCached(route)) {
      let jobStream = this.routeReuse.getCached(route)["componentRef"].instance.jobStream;
      jobStream.setStale();
      return Promise.resolve(jobStream);
    }

    const jobStream = new JobStream(this.jobManagerService,
                                    URLSearchParamsUtils.unpackURLSearchParams(route.queryParams['q']));
    return jobStream
        .loadAtLeast(initialBackendPageSize)
        .then(resp => jobStream);
  }
}
