import { Injectable, NgZone } from '@angular/core';
import { MatSnackBar } from "@angular/material/snack-bar";
import { BehaviorSubject, Subject, fromEvent } from 'rxjs';
import { ConfigLoaderService } from "../../environments/config-loader.service";
import { CapabilitiesService } from './capabilities.service';
import { AuthConfig, OAuthService } from 'angular-oauth2-oidc';
import { Router } from '@angular/router';

declare const gapi: any;

const oAuthConfig = (clientId: string, scope: string): AuthConfig => {
  return {
    issuer: 'https://accounts.google.com',
    strictDiscoveryDocumentValidation: false,
    redirectUri: `${window.location.origin}/redirect-from-oauth`,
    useSilentRefresh: true,
    silentRefreshRedirectUri: `${window.location.origin}/redirect-from-oauth-silent.html`,
    clientId, //NOTE: switch back with clientId when testing deployed version
    scope,
  }
}

//NOTE: add other attributes to this interface as needed
type UserProfile = {
  info: {
    email: string,
    sub: string, //this is the google id,
    name: string
  }
}

/** Service wrapper for google oauth2 state and starting sign-in flow. */
@Injectable()
export class AuthService {

  public userProfileSubject = new Subject<UserProfile>;
  public initAuthPromise: Promise<void>;
  public authenticated = new BehaviorSubject<boolean>(false);
  public authToken: string;
  public userId: string;
  public userEmail: string;
  public userDomain: string;
  public gcsReadAccess = false;
  public scopes: string;
  public forcedLogoutDomains: string[];
  private logoutTimer: number;
  private warningTimer: number;
  public logoutInterval: number;
  public authenticationEnabled: boolean; //NOTE: remove if this isn't needed
  readonly WARNING_INTERVAL = 10000;

  private updateUser(userProfile: UserProfile) {
    const hasValidAccessToken = this.oAuthService.hasValidAccessToken();
    if(userProfile && hasValidAccessToken) {
      const { info } = userProfile;
      this.authToken = localStorage.access_token;
      this.userEmail = info.email;
      this.userId = info.sub;
      this.gcsReadAccess = this.scopes.includes(
        "https://www.googleapis.com/auth/devstorage.read_only"
      );
      if (this.logoutInterval && this.forcedLogoutDomains && this.forcedLogoutDomains.includes(this.userDomain)) {
        this.setUpEventListeners();
      }
      this.authenticated.next(true);
    } else {
        this.authToken = undefined;
        this.userId = undefined;
        this.userEmail = undefined;
        this.userDomain = undefined;
        this.gcsReadAccess = false;
        this.authenticated.next(false);
    }
  }

  constructor(private zone: NgZone,
              private capabilitiesService: CapabilitiesService,
              private configLoader: ConfigLoaderService,
              private snackBar: MatSnackBar,
              private readonly oAuthService: OAuthService,
              private router: Router) {
                this.authToken = localStorage.access_token;
              }

  public async initOAuthImplicit() {
    await this.capabilitiesService.getCapabilities().then(async (capabilities) => {
      if (!capabilities.authentication || !capabilities.authentication.isRequired) {
        this.authenticationEnabled = false;
        return;
      }
      this.authenticationEnabled = true;
      if (capabilities.authentication.forcedLogoutDomains && capabilities.authentication.forcedLogoutTime &&
        (capabilities.authentication.forcedLogoutTime > (this.WARNING_INTERVAL * 2))) {
        this.forcedLogoutDomains = capabilities.authentication.forcedLogoutDomains;
        this.logoutInterval = capabilities.authentication.forcedLogoutTime;
      }
      this.scopes = capabilities.authentication.scopes.join(" ");
      const clientId =
        this.configLoader.getEnvironmentConfigSynchronous()["clientId"];
      const config = oAuthConfig(clientId, this.scopes)
      this.oAuthService.configure(config);
      // this.oAuthService.setupAutomaticSilentRefresh();
      const userProfile = await this.loadUserProfile();
      this.zone.run(() => this.updateUser(userProfile as UserProfile));
    }).catch((error) => {
      this.router.navigate(['sign_in']);
    })
  }

  public async loadUserProfile() {
    await this.oAuthService.loadDiscoveryDocument();
    await this.oAuthService.tryLoginImplicitFlow();
    return this.oAuthService.loadUserProfile();
  }

  public isAuthenticated(): boolean {
    return this.oAuthService.hasValidAccessToken();
  }

  public async signIn() {
    this.oAuthService.initLoginFlow();
  }

  public async signOut(){
    localStorage.removeItem("userInfo");
    this.oAuthService.logOut();
  }

  private revokeToken(): Promise<void> {
    return gapi.auth2.getAuthInstance().disconnect();
  }

  public handleError(error): void {
    this.snackBar.open('An error occurred: ' + error);
  }

  //added to test silent refresh
  public async silentRefresh() {
    await this.oAuthService.silentRefresh()
      .then((info) => {
        console.log(`Success: ${info}`)
      })
      .catch(err => console.log(`Error: ${err}`));
  }

  private setUpEventListeners(): void {
    const mouseWheelStream = fromEvent(window, "mousewheel");
    mouseWheelStream.subscribe(() => this.resetTimers());

    const mouseDownStream = fromEvent(window, "mousedown");
    mouseDownStream.subscribe(() => this.resetTimers());

    const mouseMoveStream = fromEvent(window, "mousemove");
    mouseMoveStream.subscribe(() => this.resetTimers());

    const keyDownStream = fromEvent(window, "keydown");
    keyDownStream.subscribe(() => this.resetTimers());

    const keyUpStream = fromEvent(window, "keyup");
    keyUpStream.subscribe(() => this.resetTimers());

    this.resetTimers();
  }

  public resetTimers(): void {
    window.clearTimeout(this.logoutTimer);
    window.clearTimeout(this.warningTimer);
    this.snackBar.dismiss();

    this.warningTimer = window.setTimeout(() => {
      this.snackBar.open('You are about to be logged out due to inactivity');
    }, this.logoutInterval - this.WARNING_INTERVAL);

    this.logoutTimer = window.setTimeout(() => {
      this.revokeToken().then(() => {
        window.location.reload();
      });
    }, this.logoutInterval);
  }
}
