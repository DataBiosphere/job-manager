import {Headers, Http, RequestOptions} from '@angular/http';
import {Injectable} from '@angular/core';
import 'rxjs/add/operator/toPromise';

import {CapabilitiesResponse} from '../shared/model/CapabilitiesResponse';
import {environment} from '../../environments/environment';

/** Service wrapper for accessing the capabilities endpoint. */
@Injectable()
export class CapabilitiesService {

  private capabilitiesResponse: Promise<CapabilitiesResponse>;

  constructor(private http: Http) {}

  getCapabilities(): Promise<CapabilitiesResponse> {
    if (!this.capabilitiesResponse) {
      this.capabilitiesResponse = this.http.get(`${environment.apiUrl}/capabilities`,
        new RequestOptions({headers: new Headers({'Content-Type': 'application/json'})}))
        .toPromise()
        .then(response => response.json() as CapabilitiesResponse);
    }
    return this.capabilitiesResponse;
  }
}
