import {BehaviorSubject} from 'rxjs/BehaviorSubject';
import {Injectable} from '@angular/core';

import {environment} from '../../environments/environment';

declare const gapi: any;

/** Service wrapper for google oauth2 state and starting sign-in flow. */
@Injectable()
export class AuthService {
  private initAuthPromise: Promise<void>;
  private scope = "https://www.googleapis.com/auth/genomics";
  public authenticated = new BehaviorSubject<boolean>(false);
  public authToken: string;

  private initAuth(): Promise<void> {
    console.log("CLIENTID");
    console.log(environment.clientId);
    return gapi.auth2.init({
      client_id: environment.clientId,
      cookiepolicy: 'single_host_origin',
      scope: this.scope
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
    this.initAuthPromise = new Promise<void>( (resolve, reject) => {
      gapi.load('auth2', {
        callback: () => this.initAuth().then( () => resolve() ),
        onerror: () => reject(),
      });
    });

    this.initAuthPromise.then( () => {
      // Update the current user to any subscribers and resolve the promise
      this.updateUser(gapi.auth2.getAuthInstance().currentUser.get());
      // Start listening for updates to the current user
      gapi.auth2.getAuthInstance().currentUser.listen( (user) => this.updateUser(user));
    });
  }

  public isAuthenticated(): Promise<boolean> {
    if (!environment.requiresAuth) {
      return Promise.resolve(true);
    }

    return this.initAuthPromise.then( () => {
      let user = gapi.auth2.getAuthInstance().currentUser.get();
      // Update the current user to any subscribers and resolve the promise
      this.updateUser(user);
      return user && user.isSignedIn();
    })
  }

  public signIn(): void {
    gapi.auth2.getAuthInstance().signIn();
  }
}
