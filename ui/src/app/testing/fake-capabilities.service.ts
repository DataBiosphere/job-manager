import {Injectable} from '@angular/core';

import {CapabilitiesResponse} from '../shared/model/CapabilitiesResponse';
import {CapabilitiesService} from '../core/capabilities.service';

@Injectable()
export class FakeCapabilitiesService extends CapabilitiesService {
  constructor(public capabilities: CapabilitiesResponse) {
    super(null);
  }

  getCapabilitiesSynchronous(): CapabilitiesResponse {
    return this.capabilities;
  }

  getCapabilities(): Promise<CapabilitiesResponse> {
    return Promise.resolve(this.capabilities);
  }
}
