import {Component, ViewContainerRef, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';

import {AuthService} from '../core/auth.service';
import { fromEvent } from 'rxjs';

@Component({
  templateUrl: './sign-in-redirect.component.html',
  styleUrls: ['./sign-in-redirect.component.css'],
})
export class SignInRedirectComponent implements OnInit{
  constructor(
    private readonly authService: AuthService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly viewContainer: ViewContainerRef,
    // private spinner: MatProgressSpinner,
   ) {}

   ngOnInit() {
    fromEvent
   }
}