import {Headers, Http, RequestOptions} from '@angular/http';
import {Injectable} from '@angular/core';
import 'rxjs/add/operator/toPromise';

import {CapabilitiesResponse} from '../shared/model/CapabilitiesResponse';
import {environment} from '../../environments/environment';

/** Service wrapper for accessing the capabilities endpoint. */
@Injectable()
export class CapabilitiesService {

  private capabilitiesResponse: CapabilitiesResponse;

  constructor(private http: Http) {}

  getCapabilitiesSynchronous(): CapabilitiesResponse {
    if (this.capabilitiesResponse) {
      return this.capabilitiesResponse;
    }
    throw new Error("CapabilitiesResponse has not been retrieved yet.")
  }

  getCapabilities(): Promise<CapabilitiesResponse> {
    if (this.capabilitiesResponse) {
      return Promise.resolve(this.capabilitiesResponse);
    }

    return this.http.get(`${environment.apiUrl}/capabilities`,
      new RequestOptions({headers: new Headers({'Content-Type': 'application/json'})}))
      .toPromise()
      .then(response => {
        this.capabilitiesResponse = response.json() as CapabilitiesResponse;
        return this.capabilitiesResponse;
      });
  }
}
