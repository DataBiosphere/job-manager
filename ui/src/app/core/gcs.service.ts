import {Injectable} from '@angular/core';
import {AuthService} from '../core/auth.service';

declare const gapi: any;

/** Thin wrapper around the Google Storage JSON API. */
@Injectable()
export class GcsService {

  private static readonly apiPrefix = 'https://www.googleapis.com/storage/v1';
  private static readonly maximumBytes = 1000000;

  constructor(private readonly authService: AuthService) {}

  readObject(bucket: string, object: string): Promise<any> {
    return this.canReadFiles()
      .then(() => this.getObjectData(bucket, object))
      .catch((error) => Promise.reject(error));
  }

  canReadFiles(): Promise<boolean> {
    return this.authService.isAuthenticated().then( authenticated => {
      if (authenticated && this.authService.gcsReadAccess) {
        return Promise.resolve(true);
      }
    }).catch(() =>  Promise.resolve(false));
  }

  getObjectData(bucket: string, object: string): Promise<string> {
    return gapi.client.request({
      path: `${GcsService.apiPrefix}/b/${bucket}/o/${object}`,
      params: {alt: 'media'},
      headers: {range: 'bytes=0-999999'} // Limit file size to 1MB
    })
    .then(response => {
      if (response.headers["content-length"] == GcsService.maximumBytes) {
        return response.body + "\n\nTruncated download at 1MB...";
      }
      return response.body;
    })
    .catch(response => this.handleError(response));
  }

  private handleError(response: any): Promise<string> {
    // If we get a 404 (object no found) or 416 (range not satisfiable) from GCS
    // we can assume this log file does not exist or is a 0 byte file (given
    // that our byte range is open-ended starting at 0), respectively.
    if (response.status == 404 || response.status == 416) {
      return Promise.resolve("");
    }
    return Promise.reject({
      status: response.status,
      title: "Could not read file",
      message: response.body,
    });
  }
}
