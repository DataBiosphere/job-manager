import {
  ActivatedRouteSnapshot,
  Router,
  Resolve,
  RouterStateSnapshot
} from '@angular/router';
import {Injectable} from '@angular/core';
import {map, take} from 'rxjs/operators';

import {JobMetadataResponse} from '../shared/model/JobMetadataResponse';
import {JobManagerService} from '../core/job-manager.service';

@Injectable()
export class JobDetailsResolver implements Resolve<JobMetadataResponse> {
  constructor(private jobManagerService: JobManagerService, private router: Router) {}

  resolve(route: ActivatedRouteSnapshot,
          state: RouterStateSnapshot): Promise<JobMetadataResponse> {
    return this.jobManagerService.getJob(route.params['id']);
  }
}
