import {Injectable} from '@angular/core';
import {AuthService} from '../core/auth.service';

declare const gapi: any;

// A view of a logical list of projects. This may only be a partial view of a
// larger projects list, as indicated by the exhaustive flag.
export type ProjectListView = {
  results: any[];
  exhaustive: boolean;
}

/** Thin wrapper around the Google cloudresourcemanager API project.list(). */
@Injectable()
export class ProjectsService {

  private static readonly apiUrl = "https://cloudresourcemanager.googleapis.com/v1beta1/projects"
  private static readonly defaultPageSize = 10;

  constructor(private readonly authService: AuthService) {}

  private handleError(response: any): Promise<any> {
    return Promise.reject({
      status: response.result.error.code,
      title: response.result.error.status,
      message: response.result.error.message,
    });
  }

  listProjects(filter: string): Promise<ProjectListView> {
    const authenticated = this.authService.isAuthenticated();
    if (authenticated) {
      return gapi.client.request({
        path: ProjectsService.apiUrl,
        params: {
          filter: `id:"${filter}" lifecycleState:ACTIVE`,
          pageSize: ProjectsService.defaultPageSize,
        }
      })
        .then(response => {
          let exhaustive = !response.result.nextPageToken;
          return {
            results: response.result ? response.result.projects : [],
            exhaustive: exhaustive,
          }
        })
        .catch(response => this.handleError(response));
    } else {
      return Promise.reject({
        status: 401,
        title: "Unauthorized",
        message: "Authentication failed, please try signing in again."
      })
    }
  }
}
