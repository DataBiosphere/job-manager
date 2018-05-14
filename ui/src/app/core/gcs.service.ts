import {Injectable} from '@angular/core';
import {AuthService} from '../core/auth.service';

declare const gapi: any;

/** Thin wrapper around the Google Storage JSON API. */
@Injectable()
export class GcsService {

  private static readonly apiPrefix = "https://www.googleapis.com/storage/v1";
  private static readonly maximumBytes = "1000000";

  constructor(private readonly authService: AuthService) {}

  readObject(bucket: string, object: string): Promise<string> {
    return this.isAuthenticated()
      .then( () => this.getObjectData(bucket, object))
      .catch(response => this.handleError(response));
  }

  isAuthenticated(): Promise<void> {
    return this.authService.isAuthenticated().then( authenticated => {
      if (authenticated) {
        return Promise.resolve();
      } else {
        return Promise.reject({
          status: 401,
          title: 'Unauthorized',
          message: 'Authentication failed, please try signing in again.'
        })
      }
    });
  }

  getObjectData(bucket: string, object: string): Promise<string> {
    return gapi.client.request({
      path: `${GcsService.apiPrefix}/b/${bucket}/o/${object}`,
      params: {alt: 'media'},
      headers: {range: 'bytes=0-999999'} // Limit file size to 1Mb
    })
    .then(response => {
      if (response.headers["content-length"] == GcsService.maximumBytes) {
        return response.body + "\n\nTruncated download at 1Mb...";
      } else {
        return response.body;
      }
    })
    .catch(response => this.handleError(response));
  }

  private handleError(response: any): Promise<string> {
    if (response.status == 404) {
      return Promise.resolve("");
    }
    return Promise.reject({
      status: response.status,
      title: "Could not read file",
      message: response.body,
    });
  }
}
