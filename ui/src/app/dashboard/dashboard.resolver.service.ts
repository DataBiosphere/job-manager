///<reference path="../shared/utils/url-search-params.utils.ts"/>
///<reference path="../core/job-manager.service.ts"/>
import {Injectable} from "@angular/core";
import {ActivatedRouteSnapshot, Resolve, RouterStateSnapshot} from "@angular/router";
import {AggregationResponse} from "../shared/model/AggregationResponse";
import {JobManagerService} from "../core/job-manager.service";
import {URLSearchParams} from "@angular/http";
import {defaultTimeFrame, timeFrameStringMap} from "../shared/common";
import {URLSearchParamsUtils} from "../shared/utils/url-search-params.utils";
import {TimeFrame} from "../shared/model/TimeFrame";

@Injectable()
export class DashboardResolver implements Resolve<AggregationResponse>{
  constructor(
    private jobManagerService: JobManagerService,
  ) {}

  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<AggregationResponse> {
    return this.jobManagerService.queryAggregations(timeFrameStringMap.get(route.queryParams['timeFrame']),
      URLSearchParamsUtils.unpackURLSearchParams(route.queryParams['q']).extensions.projectId);
  }
}
