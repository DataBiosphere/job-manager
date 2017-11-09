import {Headers, Http, RequestOptions} from '@angular/http';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';
import {Injectable} from '@angular/core';

import {AuthService} from '../core/auth.service';
import {environment} from '../../environments/environment';

declare const gapi: any;

/** Service wrapper for projects BLAHH. */
@Injectable()
export class ProjectsService {

  private apiUrl = "https://cloudresourcemanager.googleapis.com/v1beta1/projects"

  constructor(private readonly authService: AuthService, private http: Http) {}

  private handleError(response: any): Promise<any> {
    return Promise.reject({
      status: response.result.error.code,
      title: response.result.error.status,
      message: response.result.error.message,
    });
  }

  private getIamPolicy(projectNumber: string): Promise<any> {
    return this.authService.isAuthenticated().then( authenticated => {
      if (authenticated) {
        return gapi.client.request({
          method: 'POST',
          path: `${this.apiUrl}/${projectNumber}:getIamPolicy`,
        })
        .then(response => response.result)
        .catch(response => this.handleError(response));
      }
    });
  }

  listProjects(filter: string): Promise<any[]> {
    return this.authService.isAuthenticated().then( authenticated => {
      if (authenticated) {
        return gapi.client.request({
          path: this.apiUrl,
          params: {
            filter: `name:${filter} lifecycleState:ACTIVE`,
            pageSize: 25
          }
        })
        .then(response => response.result ? response.result.projects : [])
        .catch(response => this.handleError(response));
      }
    });
  }

  getGenomicsEnabled(projectNumber: string): Promise<void> {
    return this.getIamPolicy(projectNumber).then(result => {
      if (result && result.bindings) {
        for (let binding of result.bindings) {
          if (binding.role && binding.role == "roles/genomics.serviceAgent") {
            return;
          }
        }
      }
      throw {
        status: 403,
        title: "Permission Denied",
        message: "Need genomics.operations.create permission for this project.",
      }
    });
  }
}
