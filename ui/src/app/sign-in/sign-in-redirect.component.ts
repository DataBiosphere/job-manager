import {Component, OnInit} from '@angular/core';
import {Router} from '@angular/router';

import {AuthService} from '../core/auth.service';

@Component({
  templateUrl: './sign-in-redirect.component.html',
  styleUrls: ['./sign-in-redirect.component.css'],
})
export class SignInRedirectComponent implements OnInit{
  constructor(
    private readonly authService: AuthService,
    private readonly router: Router
   ) {}

   async ngOnInit() {
    await this.authService.initOAuthImplicit();
    const returnUrl = localStorage.getItem('jm-returnUrl') || '/';
    if(this.authService.isAuthenticated()) {
      this.router.navigate([returnUrl])
      localStorage.removeItem('jm-returnUrl');
    } else {
      this.router.navigate(["sign_in"])
    }
   }
}
