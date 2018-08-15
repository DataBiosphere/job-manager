import {AuthService} from "../core/auth.service";
import {CapabilitiesService} from "../core/capabilities.service";

export class FakeAuthService extends AuthService {
  public userId: string;

  constructor(capabilitiesService: CapabilitiesService) {
    super(null, capabilitiesService, null);
    this.userId = '';
  }
}
