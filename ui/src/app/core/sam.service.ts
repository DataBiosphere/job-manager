import {HttpHeaders, HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {AuthService} from './auth.service';
import {CapabilitiesService} from "./capabilities.service";
import {CapabilitiesResponse} from "../shared/model/CapabilitiesResponse";
import {ConfigLoaderService} from "../../environments/config-loader.service";
import {JobOperationResponse} from "../shared/model/JobOperationResponse";
import {FileContents} from "../shared/model/FileContents";

@Injectable()
export class SamService {

  capabilities: CapabilitiesResponse;
  apiUrl: string;

  constructor(private readonly authService: AuthService,
              private readonly capabilitiesService: CapabilitiesService,
              private readonly configLoader: ConfigLoaderService,
              private http: HttpClient,) {
    capabilitiesService.getCapabilities().then(capabilities => {
      this.capabilities = capabilities;
    });
    this.apiUrl = this.configLoader.getEnvironmentConfigSynchronous()['apiUrl'];
  }

  private getHttpHeaders(): HttpHeaders {
    let headers = new HttpHeaders({'Content-Type': 'application/json'});
    if (this.authService.authToken) {
      headers.set('Authentication', `Bearer ${this.authService.authToken}`);
    }
    return headers;
  }

  canReadFiles(): boolean {
    try {
      return this.authService.isAuthenticated() && this.capabilities.authentication.outsideAuth;
    } catch (error) {
      this.handleError(error);
    }
  }

  async getFileTail(bucket: string, object: string): Promise<FileContents> {
    return this.http.get(`${this.apiUrl}/jobs/tailFile`,
      {
        params: {
          'bucket': bucket,
          'object': object
        },
        headers: this.getHttpHeaders()
      })
      .toPromise()
      .then(response => {
        return response;
      })
      .catch((error) => this.handleError(error));
  }

  getOperationDetails(jobId:string, operationId:string): Promise<JobOperationResponse> {
    return this.http.get(`${this.apiUrl}/jobs/operationDetails`,
      {
        params: {
          'job': jobId,
          'operation' : operationId
        },
        headers: this.getHttpHeaders()
      })
      .toPromise()
      .then(response => response)
      .catch((error) => this.handleError(error));
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
