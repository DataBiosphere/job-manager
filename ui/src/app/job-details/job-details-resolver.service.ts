import {
  ActivatedRouteSnapshot,
  Router,
  Resolve,
  RouterStateSnapshot
} from '@angular/router';
import {Injectable} from '@angular/core';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/take';

import {JobMetadataResponse} from '../shared/model/JobMetadataResponse';
import {JobMonitorService} from '../core/job-monitor.service';

@Injectable()
export class JobDetailsResolver implements Resolve<JobMetadataResponse> {
  constructor(private jobMonitorService: JobMonitorService, private router: Router) {}

  resolve(route: ActivatedRouteSnapshot,
          state: RouterStateSnapshot): Promise<JobMetadataResponse> {
    return this.jobMonitorService.getJob(route.params['id'])
      .then(response => {
        return response;
      })
      .catch(error => {
        // TODO(bryancrampton): Handle the client-facing error here and redirect
        // back to the correct jobs page (with parentId)
        this.router.navigate(['/jobs']);
        return null;
      });
  }
}
