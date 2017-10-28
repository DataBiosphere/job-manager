import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';

import {AuthService} from '../core/auth.service';

@Component({
  templateUrl: './sign-in.component.html',
  styleUrls: ['./sign-in.component.css'],
})
export class SignInComponent implements OnInit {
  constructor(
    private readonly authService: AuthService,
    private readonly route: ActivatedRoute,
    private readonly router: Router) {}

  ngOnInit() {
    let returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
    this.authService.authenticated.subscribe( (authenticated) => {
      if (authenticated) {
        this.router.navigateByUrl(returnUrl);
      }
    });
  }

  private signIn(): void {
    this.authService.signIn();
  }
}
