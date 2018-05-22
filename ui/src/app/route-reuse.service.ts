import {Injectable} from '@angular/core';
import {
  ActivatedRouteSnapshot,
  DetachedRouteHandle,
  RouteReuseStrategy,
  Routes
} from '@angular/router';

// Configure reuse of particular routes so components do not have to re-load
@Injectable()
export class RouteReuse implements RouteReuseStrategy {

  public static cached: { [key: string]: any } = {};

  public static routeKey(route: ActivatedRouteSnapshot): string {
    // We currently only cache the jobs-list route so we can store them based
    // on just the query parameter. If we add job-detail caching we should
    // make this key more specific.
    return route.queryParams.q
  }

  shouldDetach(route: ActivatedRouteSnapshot): boolean {
    // Currently we only cache the job list page, we may want to also do
    // details pages in the future.
    return !!route.routeConfig && route.routeConfig.path == "jobs";
  }

  store(route: ActivatedRouteSnapshot, handle: DetachedRouteHandle): void {
    let storedRoute = {
        snapshot: route,
        handle: handle
    };
    RouteReuse.cached[RouteReuse.routeKey(route)] = storedRoute;
  }

  shouldAttach(route: ActivatedRouteSnapshot): boolean {
    return !!route.routeConfig
      && route.routeConfig.path == "jobs"
      && !!RouteReuse.cached[RouteReuse.routeKey(route)];
  }

  retrieve(route: ActivatedRouteSnapshot): DetachedRouteHandle {
    if (!route.routeConfig || !RouteReuse.cached[RouteReuse.routeKey(route)]) {
      return null;
    }
    return RouteReuse.cached[RouteReuse.routeKey(route)].handle;
  }

  shouldReuseRoute(future: ActivatedRouteSnapshot, curr: ActivatedRouteSnapshot): boolean {
    return false;
  }
}
