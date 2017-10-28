import {ActivatedRouteSnapshot, RouterStateSnapshot, Router} from '@angular/router';
import {CanActivate} from '@angular/router';
import {Injectable} from '@angular/core';

import {AuthService} from './auth.service';

/** Service wrapper for routing based on current authentication state. */
@Injectable()
export class AuthActivator implements CanActivate {

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    // First check if the AuthService has already loaded and authenticated
    if (this.authService.authenticated.getValue()) {
      return true;
    }

    return new Promise<boolean>( (resolve) => {
      this.authService.isAuthenticated().then( (authenticated) => {
        if (!authenticated) {
          this.router.navigate(['sign_in'], {
            queryParams: { returnUrl: state.url }
          });
        }
        resolve(authenticated);
      });
    });
  }
}
