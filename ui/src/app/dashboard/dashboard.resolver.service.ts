import {Injectable} from "@angular/core";
import {ActivatedRouteSnapshot, Resolve, RouterStateSnapshot} from "@angular/router";
import {AggregationResponse} from "../shared/model/AggregationResponse";
import {JobManagerService} from "../core/job-manager.service";
import {defaultTimeFrame} from "../shared/common";
import {URLSearchParamsUtils} from "../shared/utils/url-search-params.utils";
import {TimeFrame} from "../shared/model/TimeFrame";

@Injectable()
export class DashboardResolver implements Resolve<AggregationResponse>{
  constructor(
    private jobManagerService: JobManagerService,
  ) {}

  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<AggregationResponse> {
    let timeFrame = defaultTimeFrame;

    if (route.queryParams['timeFrame']) {
      timeFrame = <TimeFrame>route.queryParams['timeFrame'];
    }
    return this.jobManagerService.queryAggregations(timeFrame,
      URLSearchParamsUtils.unpackURLSearchParams(route.queryParams['q']).extensions.projectId);
  }
}
