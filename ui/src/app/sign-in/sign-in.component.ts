import {Component, OnInit, ViewContainerRef} from '@angular/core';
import {MatSnackBar} from '@angular/material'
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
    private readonly router: Router,
    private readonly viewContainer: ViewContainerRef,
    private errorBar: MatSnackBar) {}

  ngOnInit() {
    let returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
    this.authService.authenticated.subscribe( (authenticated) => {
      if (authenticated) {
        this.router.navigateByUrl(returnUrl).then(() => {
          if (this.authService.logoutInterval) {
            this.authService.resetTimers();
          }
        });
      }
    });
  }

  public signIn(): void {
    this.authService.signIn().catch((error) => this.handleError(error));
  }

  handleError(error: any) {
    let message = `An error has occurred during sign in: ${error["error"]}`;
    this.errorBar.open(message, 'Dismiss', {
      viewContainerRef: this.viewContainer,
      duration: 3000,
    });
  }
}
