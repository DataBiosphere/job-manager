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

  private cached: { [key: string]: DetachedRouteHandle } = {};

  public isCached(route: ActivatedRouteSnapshot): boolean {
    return !!this.cached[RouteReuse.routeKey(route)];
  }

  public getCached(route: ActivatedRouteSnapshot): DetachedRouteHandle {
    return this.cached[RouteReuse.routeKey(route)];
  }

  shouldDetach(route: ActivatedRouteSnapshot): boolean {
    // Currently we only cache the job list page, we may want to also do
    // details pages in the future.
    return !!route.routeConfig && route.routeConfig.path == 'jobs';
  }

  store(route: ActivatedRouteSnapshot, handle: DetachedRouteHandle): void {
    this.cached[RouteReuse.routeKey(route)] = handle;
  }

  shouldAttach(route: ActivatedRouteSnapshot): boolean {
    return !!route.routeConfig
      && route.routeConfig.path == 'jobs'
      && this.isCached(route);
  }

  retrieve(route: ActivatedRouteSnapshot): DetachedRouteHandle {
    if (!route.routeConfig || !this.isCached(route)) {
      return null;
    }
    return this.getCached(route);
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
