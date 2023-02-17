import { Injectable, NgZone } from '@angular/core';
import { MatSnackBar } from "@angular/material/snack-bar";
import { BehaviorSubject, fromEvent } from 'rxjs';
import { ConfigLoaderService } from "../../environments/config-loader.service";
import { CapabilitiesService } from './capabilities.service';
import { AuthConfig, OAuthService } from 'angular-oauth2-oidc';

declare const gapi: any;

const oAuthConfig = (clientId: string, scope: string): AuthConfig => {
  return {
    issuer: 'https://accounts.google.com',
    strictDiscoveryDocumentValidation: false,
    redirectUri: window.location.origin,
    clientId,
    scope,
  }
}

/** Service wrapper for google oauth2 state and starting sign-in flow. */
@Injectable()
export class AuthService {
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
  public authenticationEnabled: boolean;
  readonly WARNING_INTERVAL = 10000;

  // public async initAuthConfig(): Promise<AuthConfig> {
  //   const clientId = this.configLoader.getEnvironmentConfigSynchronous()['clientId'];
  //   const scope = this.scopes;
  //   const issuer = "https://accounts.google.com/o/oauth2/v2/auth";
  //   return {
  //     issuer,
  //     redirectUri: `${window.location.origin}/index.html`,
  //     clientId,
  //     scope
  //   }
  // }

  private updateUser(user: any) {
    if (user && user.isSignedIn()) {
      this.authToken = user.getAuthResponse().access_token;
      this.userId = user.getId();
      this.userEmail = user.getBasicProfile().getEmail();
      this.userDomain = user.getHostedDomain();
      this.gcsReadAccess = this.scopes.includes('https://www.googleapis.com/auth/devstorage.read_only');
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

  constructor(private zone: NgZone, capabilitiesService: CapabilitiesService,
              private configLoader: ConfigLoaderService,
              private readonly oAuthService: OAuthService,
              private snackBar: MatSnackBar) {
    // const clientId =
    //   this.configLoader.getEnvironmentConfigSynchronous()["clientId"];
    capabilitiesService.getCapabilities().then(capabilities => {
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
      oAuthService.configure(config);
      oAuthService.loadDiscoveryDocument().then(() => {
        oAuthService.tryLoginImplicitFlow().then(() => {
          // if(!oAuthService.hasValidAccessToken) {
          //   oAuthService.initLoginFlow();
          // } else {
          //   oAuthService.loadUserProfile().then((userProfile) => {
          //     console.log(userProfile)
          //   })
          // }
          if(oAuthService.hasValidAccessToken()) {
            oAuthService.loadUserProfile().then((userProfile) => {
              console.log(userProfile);
            })
          }
        })
      })

      // this.initAuthPromise = new Promise<void>( (resolve, reject) => {
      //   gapi.load('client:auth2', {
      //     callback: () => this.initAuth(capabilities.authentication.scopes)
      //       .then(() => resolve())
      //       .catch((message) => this.handleError(message)),
      //     onerror: () => reject(),
      //   });
      // });

      // this.initAuthPromise.then( () => {
      //   // Update the current user to any subscribers and resolve the promise
      //   this.updateUser(gapi.auth2.getAuthInstance().currentUser.get());
      //   // Start listening for updates to the current user
      //   gapi.auth2.getAuthInstance().currentUser.listen( (user) => {
      //     // gapi executes callbacks outside of the Angular zone. To ensure that
      //     // UI changes occur correctly, explicitly run all subscriptions to
      //     // authentication state within the Angular zone for component change
      //     // detection to work.
      //     this.zone.run(() => this.updateUser(user));
      //   });
      // });
    });
  }

  public isAuthenticated(): boolean {
    return this.oAuthService.hasValidAccessToken();
  }

  public async signIn() {
    // this.oAuthService.initLoginFlow()
    this.oAuthService.initLoginFlow()
  }

  public async signOut(){
    // return await this.oauthService.logOut();
  }

  private revokeToken(): Promise<void> {
    return gapi.auth2.getAuthInstance().disconnect();
  }

  private handleError(error): void {
    this.snackBar.open('An error occurred: ' + error);
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
