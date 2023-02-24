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
    console.log(this.authService);
    await this.authService.initOAuthImplicit();
    if(this.authService.isAuthenticated()) {
      this.router.navigate(["/"])
    } else {
      this.router.navigate(["sign_in"])
    }
   }
}
