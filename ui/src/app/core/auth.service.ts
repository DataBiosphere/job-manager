import {BehaviorSubject} from 'rxjs/BehaviorSubject';
import {Injectable, NgZone} from '@angular/core';
import {MatSnackBar} from "@angular/material";

import {CapabilitiesService} from './capabilities.service';
import {ConfigLoaderService} from "../../environments/config-loader.service";
import {Observable} from "rxjs";

declare const gapi: any;

/** Service wrapper for google oauth2 state and starting sign-in flow. */
@Injectable()
export class AuthService {
  private initAuthPromise: Promise<void>;
  public authenticated = new BehaviorSubject<boolean>(false);
  public authToken: string;
  public userId: string;
  public userEmail: string;
  public userDomain: string;
  public gcsReadAccess: boolean;
  public forcedLogoutDomains: string[];
  private logoutTimer: number;
  private warningTimer: number;
  public logoutInterval: number;
  readonly WARNING_INTERVAL = 10000;

  private initAuth(scopes: string[]): Promise<any> {
    const clientId = this.configLoader.getEnvironmentConfigSynchronous()['clientId'];
    this.gcsReadAccess = scopes.includes('https://www.googleapis.com/auth/devstorage.read_only');

    return new Promise<void>( (resolve, reject) => {
      gapi.auth2.init({
        client_id: clientId,
        cookiepolicy: 'single_host_origin',
        scope: scopes.join(" "),
      }).then(() => resolve())
        .catch((error) => reject(error))
    });
  }

  private updateUser(user: any) {
    if (user && user.isSignedIn()) {
      this.authToken = user.getAuthResponse().access_token;
      this.userId = user.getId();
      this.userEmail = user.getBasicProfile().getEmail();
      this.userDomain = user.getHostedDomain();
      this.authenticated.next(true);

      if (this.logoutInterval && this.forcedLogoutDomains && this.forcedLogoutDomains.includes(this.userDomain)) {
        this.setUpEventListeners();
      }
    } else {
      this.authToken = undefined;
      this.userId = undefined;
      this.userEmail = undefined;
      this.userDomain = undefined;
      this.authenticated.next(false);
    }
  }

  constructor(private zone: NgZone, capabilitiesService: CapabilitiesService,
              private configLoader: ConfigLoaderService,
              private snackBar: MatSnackBar) {
    capabilitiesService.getCapabilities().then(capabilities => {
      if (!capabilities.authentication || !capabilities.authentication.isRequired) {
        return;
      }

      if (capabilities.authentication.forcedLogoutDomains && capabilities.authentication.forcedLogoutTime && capabilities.authentication.forcedLogoutTime > (this.WARNING_INTERVAL * 2)) {
        this.forcedLogoutDomains = capabilities.authentication.forcedLogoutDomains;
        this.logoutInterval = capabilities.authentication.forcedLogoutTime;
      }

      this.initAuthPromise = new Promise<void>( (resolve, reject) => {
        gapi.load('client:auth2', {
          callback: () => this.initAuth(capabilities.authentication.scopes)
            .then(() => resolve())
            .catch((message) => { this.handleError(message)}),
          onerror: () => reject(),
        });
      });

      this.initAuthPromise.then( () => {
        // Update the current user to any subscribers and resolve the promise
        this.updateUser(gapi.auth2.getAuthInstance().currentUser.get());
        // Start listening for updates to the current user
        gapi.auth2.getAuthInstance().currentUser.listen( (user) => {
          // gapi executes callbacks outside of the Angular zone. To ensure that
          // UI changes occur correctly, explicitly run all subscriptions to
          // authentication state within the Angular zone for component change
          // detection to work.
          this.zone.run(() => this.updateUser(user));
        });
      });
    });
  }

  public isAuthenticated(): Promise<boolean> {
    return this.initAuthPromise.then( () => {
      let user = gapi.auth2.getAuthInstance().currentUser.get();
      // Update the current user to any subscribers and resolve the promise
      this.updateUser(user);
      return !!(user && user.isSignedIn());
    })
  }

  public signIn(): Promise<void> {
    return new Promise<void>( (resolve, reject) => {
      gapi.auth2.getAuthInstance().signIn()
        .then(user => resolve(user))
        .catch(error => reject(error))
    });
  }

  public signOut(): Promise<void> {
    return new Promise<void>( (resolve, reject) => {
      gapi.auth2.getAuthInstance().signOut()
        .then(user => resolve(user))
        .catch(error => reject(error))
    });
  }

  private revokeToken(): Promise<void> {
    return new Promise<void>( (resolve, reject) => {
      gapi.auth2.getAuthInstance().disconnect()
        .then(user => resolve(user))
        .catch(error => reject(error))
    });
  }

  private handleError(error): void {
      this.snackBar.open('An error occurred: ' + error);
  }

  private setUpEventListeners(): void {
    const mouseWheelStream = Observable.fromEvent(window, "mousewheel");
    mouseWheelStream.subscribe(() => this.resetTimers());

    const mouseDownStream = Observable.fromEvent(window, "mousedown");
    mouseDownStream.subscribe(() => this.resetTimers());

    const mouseMoveStream = Observable.fromEvent(window, "mousemove");
    mouseMoveStream.subscribe(() => this.resetTimers());

    const keyDownStream = Observable.fromEvent(window, "keydown");
    keyDownStream.subscribe(() => this.resetTimers());

    const keyUpStream = Observable.fromEvent(window, "keyup");
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
