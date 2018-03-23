import {Injectable} from '@angular/core';
import {AuthService} from '../core/auth.service';

declare const gapi: any;

/** Thin wrapper around the Google Storage JSON API. */
@Injectable()
export class GcsService {

  private static readonly apiPrefix = "https://www.googleapis.com/storage/v1"

  constructor(private readonly authService: AuthService) {}

  readObject(bucket: string, object: string): Promise<string> {
    return this.authService.isAuthenticated().then( authenticated => {
      if (authenticated) {
        return gapi.client.request({
          path: `${GcsService.apiPrefix}/b/${bucket}/o/${object}`,
          params: {alt: 'media'}
        })
        .then(response => response.body)
         // If a file not found error occurs ignore it, the file may not exist
         // if it was never written to.
        .catch(response => {
          if (response.status == 404) {
            return "";
          }
          return Promise.reject({
            status: response.status,
            title: "Could not read file",
            message: response.body,
          });
        })
      } else {
        return Promise.reject({
          status: 401,
          title: 'Unauthorized',
          message: 'Authentication failed, please try signing in again.'
        })
      }
    });
  }
}
