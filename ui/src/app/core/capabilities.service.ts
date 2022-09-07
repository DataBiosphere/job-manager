import {Headers, Http, RequestOptions} from '@angular/http';
import {Injectable} from '@angular/core';

import {CapabilitiesResponse} from '../shared/model/CapabilitiesResponse';
import {ConfigLoaderService} from "../../environments/config-loader.service";

/** Service wrapper for accessing the capabilities endpoint. */
@Injectable()
export class CapabilitiesService {

  private capabilitiesResponse: CapabilitiesResponse;
  private capabilitiesResponsePromise: Promise<CapabilitiesResponse>;

  constructor(private http: Http,
              private configLoader:ConfigLoaderService) {}

  getCapabilitiesSynchronous(): CapabilitiesResponse {
    if (this.capabilitiesResponse) {
      return this.capabilitiesResponse;
    }
    throw new Error("CapabilitiesResponse has not been retrieved yet.")
  }

  getCapabilities(): Promise<CapabilitiesResponse> {
    if (!this.capabilitiesResponsePromise) {
      const apiUrl = this.configLoader.getEnvironmentConfigSynchronous()['apiUrl'];
      this.capabilitiesResponsePromise =
        this.http.get(`${apiUrl}/capabilities`,
          new RequestOptions({headers: new Headers({'Content-Type': 'application/json'})}))
          .toPromise()
          .then(response => {
            this.capabilitiesResponse = response.json() as CapabilitiesResponse;
            return this.capabilitiesResponse;
          });
    }

    return this.capabilitiesResponsePromise;
  }
}
