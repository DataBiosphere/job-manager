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
import {QueryJobsRequest} from '../shared/model/QueryJobsRequest';
import {QueryJobsResponse} from '../shared/model/QueryJobsResponse';
import {StatusGroup} from '../shared/common';
import {JobStream} from '../shared/job-stream';

import {environment} from '../../environments/environment';

@Injectable()
export class JobListResolver implements Resolve<JobStream> {
  private static readonly initialBackendPageSize = 25;

  constructor(private JobManagerService: JobManagerService, private router: Router) {}

  private getStatusGroupNavigateIfInvalid(route: ActivatedRouteSnapshot): StatusGroup {
    let statusGroup: StatusGroup = route.queryParams['statusGroup']
      ? route.queryParams['statusGroup']
      : StatusGroup.Active;

    if (!(statusGroup in StatusGroup)) {
      this.router.navigate([], {
        queryParams: {
            parentId: route.params['parentId'],
            statusGroup: null
        }
      })
      return undefined;
    }
    return statusGroup;
  }

  resolve(route: ActivatedRouteSnapshot,
          state: RouterStateSnapshot): Promise<JobStream> {
    let statusGroup = this.getStatusGroupNavigateIfInvalid(route);
    if (!statusGroup) {
      return null;
    }

    let jobStream = new JobStream(this.JobManagerService,
                                  statusGroup,
                                  route.queryParams['parentId']);
    return jobStream
        .loadAtLeast(JobListResolver.initialBackendPageSize)
        .then(resp => jobStream)
        .catch(error => {
          this.router.navigate([environment.entryPoint]);
          return Promise.reject(error);
        });
  }
}
