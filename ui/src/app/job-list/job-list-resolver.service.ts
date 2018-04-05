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

import {environment} from '../../environments/environment';
import {URLSearchParamsUtils} from "../shared/utils/url-search-params.utils";

@Injectable()
export class JobListResolver implements Resolve<JobStream> {
  constructor(private jobManagerService: JobManagerService, private router: Router) {}

  resolve(route: ActivatedRouteSnapshot,
          state: RouterStateSnapshot): Promise<JobStream> {

    let jobStream = new JobStream(this.jobManagerService,
                                  URLSearchParamsUtils.unpackURLSearchParams(route.queryParams['q']));
    return jobStream
        .loadAtLeast(initialBackendPageSize)
        .then(resp => jobStream);
  }
}
