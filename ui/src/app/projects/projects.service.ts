import {Headers, Http, RequestOptions} from '@angular/http';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';
import {Injectable} from '@angular/core';

import {AuthService} from '../core/auth.service';
import {environment} from '../../environments/environment';

declare const gapi: any;

/** Service wrapper around the Google cloudresourcemanager API. */
@Injectable()
export class ProjectsService {

  private static readonly apiUrl = "https://cloudresourcemanager.googleapis.com/v1beta1/projects"
  private static readonly defaultPageSize = 25;

  constructor(private readonly authService: AuthService, private http: Http) {}

  private handleError(response: any): Promise<any> {
    return Promise.reject({
      status: response.result.error.code,
      title: response.result.error.status,
      message: response.result.error.message,
    });
  }

  listProjects(filter: string): Promise<any[]> {
    return this.authService.isAuthenticated().then( authenticated => {
      if (authenticated) {
        return gapi.client.request({
          path: ProjectsService.apiUrl,
          params: {
            filter: `id:"${filter}" lifecycleState:ACTIVE`,
            pageSize: ProjectsService.defaultPageSize,
          }
        })
        .then(response => response.result ? response.result.projects : [])
        .catch(response => this.handleError(response));
      }
    });
  }
}
