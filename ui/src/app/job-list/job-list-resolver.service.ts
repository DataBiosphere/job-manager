import {
  ActivatedRouteSnapshot,
  Router,
  Resolve,
  RouterStateSnapshot
} from '@angular/router';
import {Injectable} from '@angular/core';
import {map, take} from 'rxjs/operators';

import {JobManagerService} from '../core/job-manager.service';
import {initialBackendPageSize} from '../shared/common';
import {JobStream} from '../shared/job-stream';
import {RouteReuse} from '../route-reuse.service';

import {URLSearchParamsUtils} from "../shared/utils/url-search-params.utils";
import {SettingsService} from "../core/settings.service";

@Injectable()
export class JobListResolver implements Resolve<JobStream> {
  constructor(
    private jobManagerService: JobManagerService,
    private settingsService: SettingsService,
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

    let jobsRequest = URLSearchParamsUtils.unpackURLSearchParams(route.queryParams['q']);
    const projectId = jobsRequest.extensions.projectId || '';
    const settings = this.settingsService.getSettingsForProject(projectId);
    if (settings && settings.hideArchived) {
      jobsRequest.extensions['hideArchived'] = true;
    }

    const jobStream = new JobStream(this.jobManagerService, jobsRequest);
    return jobStream
        .loadAtLeast(initialBackendPageSize)
        .then(resp => jobStream);
  }
}
