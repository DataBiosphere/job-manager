import {BehaviorSubject} from 'rxjs/BehaviorSubject';
import {Injectable, NgZone} from '@angular/core';
import {MatSnackBar} from "@angular/material";

import {CapabilitiesService} from './capabilities.service';
import {ConfigLoaderService} from "../../environments/config-loader.service";

declare const gapi: any;

/** Service wrapper for google oauth2 state and starting sign-in flow. */
@Injectable()
export class AuthService {
  private initAuthPromise: Promise<void>;
  public authenticated = new BehaviorSubject<boolean>(false);
  public authToken: string;
  public userId: string;
  public userEmail: string;

  private initAuth(scopes: string[]): Promise<any> {
    const clientId = this.configLoader.getEnvironmentConfigSynchronous()['clientId'];

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
      this.authenticated.next(true);
    } else {
      this.authToken = undefined;
      this.userId = undefined;
      this.userEmail = undefined;
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

  public signIn(): Promise<any> {
    return new Promise<void>( (resolve, reject) => {
      gapi.auth2.getAuthInstance().signIn()
        .then(user => resolve(user))
        .catch(error => reject(error))
    });
  }

  public signOut(): Promise<any> {
    const auth2 = gapi.auth2.getAuthInstance();
    return auth2.signOut();
  }

  private handleError(error): void {
      this.snackBar.open('An error occurred: ' + error);
  }
}
