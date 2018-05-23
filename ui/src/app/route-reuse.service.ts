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

  public static isCached(route: ActivatedRouteSnapshot): boolean {
    return !!RouteReuse.cached[RouteReuse.routeKey(route)];
  }

  public static getCached(route: ActivatedRouteSnapshot): any {
    return RouteReuse.cached[RouteReuse.routeKey(route)];
  }

  shouldDetach(route: ActivatedRouteSnapshot): boolean {
    // Currently we only cache the job list page, we may want to also do
    // details pages in the future.
    return !!route.routeConfig && route.routeConfig.path == "jobs";
  }

  store(route: ActivatedRouteSnapshot, handle: DetachedRouteHandle): void {
    RouteReuse.cached[RouteReuse.routeKey(route)] = {
        snapshot: route,
        handle: handle
    };
  }

  shouldAttach(route: ActivatedRouteSnapshot): boolean {
    return !!route.routeConfig
      && route.routeConfig.path == "jobs"
      && !!RouteReuse.cached[RouteReuse.routeKey(route)];
  }

  retrieve(route: ActivatedRouteSnapshot): DetachedRouteHandle {
    if (!route.routeConfig || !RouteReuse.isCached(route)) {
      return null;
    }
    return RouteReuse.getCached(route).handle;
  }

  shouldReuseRoute(future: ActivatedRouteSnapshot, curr: ActivatedRouteSnapshot): boolean {
    return future.routeConfig === curr.routeConfig;
  }

  private static routeKey(route: ActivatedRouteSnapshot): string {
    // We currently only cache the jobs-list route so we can store them based
    // on just the query parameter. If we add job-detail caching we should
    // make this key more specific.
    return route.queryParams.q;
  }
}
