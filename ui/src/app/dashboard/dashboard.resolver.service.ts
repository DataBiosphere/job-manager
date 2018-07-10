import {Injectable} from "@angular/core";
import {ActivatedRouteSnapshot, Resolve, RouterStateSnapshot} from "@angular/router";
import {AggregationResponse} from "../shared/model/AggregationResponse";
import {JobManagerService} from "../core/job-manager.service";
import {TimeFrame} from "../shared/model/TimeFrame";
import {URLSearchParamsUtils} from "../shared/utils/url-search-params.utils";

@Injectable()
export class DashboardResolver implements Resolve<AggregationResponse>{
  constructor(
    private jobManagerService: JobManagerService,
  ) {}

  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<AggregationResponse> {
    return this.jobManagerService.queryAggregations(TimeFrame.DAYS7,
      URLSearchParamsUtils.unpackURLSearchParams(route.queryParams['q']).extensions.projectId);
  }
}
