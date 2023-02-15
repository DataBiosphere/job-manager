import {Component} from '@angular/core';
import {AuthService} from "./core/auth.service";
import {Router} from "@angular/router";
import {CustomIconService} from './core/custom-icon.service';
import { OAuthService } from 'angular-oauth2-oidc';
import { JwksValidationHandler } from 'angular-oauth2-oidc-jwks';

@Component({
  selector: 'jm-app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {

  constructor(
    private readonly router: Router,
    private readonly authService: AuthService,
    private customIconService: CustomIconService,
    private readonly oauthService: OAuthService
  ) {
    this.initOauth()
  }

  private async initOauth(): Promise<void> {
    const authConfig = await this.authService.initAuthConfig();
    this.oauthService.configure(authConfig);
    this.oauthService.tokenValidationHandler = new JwksValidationHandler();
    return Promise.resolve();
  }

  isSignedIn(): boolean {
    return !!this.authService.userId;
  }

  signOut(): void {
    this.authService.signOut().then(() => {
      window.location.reload();
    });
  }
}
