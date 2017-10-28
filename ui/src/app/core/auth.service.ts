import {BehaviorSubject} from 'rxjs/BehaviorSubject';
import {Injectable} from '@angular/core';

import {environment} from '../../environments/environment';

declare const gapi: any;

/** Service wrapper for google oauth2 state and starting sign-in flow. */
@Injectable()
export class AuthService {
  private clientId:string = '738242158346-l0vdrjp6sdlg61ni5fm26m7nu75gql51.apps.googleusercontent.com';
  private initAuthPromise: Promise<void>;
  private scope = [
    "https://www.googleapis.com/auth/cloud-platform",
    "https://www.googleapis.com/auth/genomics"
  ].join(" ");

  public authenticated = new BehaviorSubject<boolean>(false);
  public authToken: string;
  public requiresAuth = environment.requiresAuth;

  private beginListening(): void {
    this.initAuthPromise.then( () => {
      // Update the current user to any subscribers and resolve the promise
      this.updateUser(gapi.auth2.getAuthInstance().currentUser.get());
      // Start listening for updates to the current user
      gapi.auth2.getAuthInstance().currentUser.listen( (user) => this.updateUser(user));
    });
  }

  private initAuth(): Promise<void> {
    return gapi.auth2.init({
      client_id: this.clientId,
      cookiepolicy: 'single_host_origin',
      scope: this.scope
    });
  }

  private loadAndInitAuth(): Promise<void> {
    return new Promise<void>( (resolve) => {
      gapi.load('auth2', {
        callback: () => this.initAuth().then( () => resolve() ),
        // TODO(bryancrampton): Implement real error handling.
        onerror: () => console.log('gapi.client failed to load!'),
      });
    });
  }

  private updateUser(user: any) {
    this.authenticated.next(user && user.isSignedIn());
    if (this.authenticated.getValue()) {
      this.authToken = user.getAuthResponse().access_token;
    } else {
      this.authToken = undefined;
    }
  }

  constructor() {
    this.initAuthPromise = this.loadAndInitAuth();
    this.beginListening();
  }

  public isAuthenticated(): Promise<boolean> {
    if (this.requiresAuth == false) {
      return Promise.resolve(true);
    }
    return new Promise<boolean>( (resolve) => {
      return this.initAuthPromise.then( () => {
          let user = gapi.auth2.getAuthInstance().currentUser.get();
          // Update the current user to any subscribers and resolve the promise
          this.updateUser(user);
          resolve(user && user.isSignedIn());
      });
    });
  }

  public signIn(): void {
    gapi.auth2.getAuthInstance().signIn();
  }
}
