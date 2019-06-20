import {Injectable} from '@angular/core';
import {AuthService} from './auth.service';

declare const gapi: any;

/** Thin wrapper around the Google Storage JSON API. */
@Injectable()
export class GcsService {

  private static readonly apiPrefix = 'https://www.googleapis.com/storage/v1';
  private static readonly maximumBytes = 1000000;

  constructor(private readonly authService: AuthService) {}

  async readObject(bucket: string, object: string): Promise<string> {
    try {
      const hasAccess = this.canReadFiles();
      if (hasAccess) {
        return this.getObjectData(bucket, object);
      }
      return '';
    } catch (error) {
      this.handleError(error);
    }
  }

  canReadFiles(): boolean {
    try {
      return this.authService.isAuthenticated() && this.authService.gcsReadAccess;
    } catch (error) {
      this.handleError(error);
    }
  }

  async getObjectData(bucket: string, object: string): Promise<string> {
    try {
      const hasContent = await this.hasContent(bucket, object);
      if (hasContent) {
        const {headers, body} = await gapi.client.request({
          path: `${GcsService.apiPrefix}/b/${bucket}/o/${object}`,
          params: {alt: 'media'},
          headers: {range: 'bytes=0-999999'} // Limit file size to 1MB
        });
        if (headers["content-length"] == GcsService.maximumBytes) {
          return body + "\n\nTruncated download at 1MB...";
        }
        return body;
      }
      else {
        return '';
      }
    } catch (error) {
      this.handleError(error);
    }
  }

  async hasContent(bucket: string, object: string): Promise<boolean> {
    try {
      const {result: {size}} =  await gapi.client.request({
        path: `${GcsService.apiPrefix}/b/${bucket}/o/${object}`
      });
      return size > 0;
    } catch (error) {
      this.handleError(error);
    }
  }

  private handleError(response: any): Object {
    // If we get a 404 (object no found) or 416 (range not satisfiable) from GCS
    // we can assume this log file does not exist or is a 0 byte file (given
    // that our byte range is open-ended starting at 0), respectively.
    if (response.status == 404 || response.status == 416) {
      return '';
    }

    if (response.hasOwnProperty('message')) {
      return {
        status: response.status,
        title: "Could not read file",
        message: response.message,
      };
    }
    if (response.hasOwnProperty('body')) {
      let parsedBody = JSON.parse(response.body);
      if (parsedBody.error.errors[0].message) {
        return {
          status: response.status,
          title: "Could not read file",
          message: parsedBody.error.errors[0].message,
        };
      } else {
        return {
          status: response.status,
          title: "Could not read file",
          message: response.body,
        };
      }
    }
  }
}
