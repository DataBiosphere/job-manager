import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { Router, RouterModule } from "@angular/router";
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { SignInRedirectComponent } from './sign-in-redirect.component';
import { AuthService } from '../core/auth.service';

@NgModule({
  imports: [CommonModule, RouterModule, MatProgressSpinnerModule],
  declarations: [SignInRedirectComponent],
  exports: [],
})

export class SignInRedirectModule {
  constructor(
    private readonly authService: AuthService,
    private readonly router: Router
  ) {
    authService.authenticated.subscribe(isAuthenticated => {
      if(isAuthenticated) {
        debugger;
        router.navigate(['/dashboard'])
      }
    })
  }
}
