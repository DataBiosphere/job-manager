import {Component, OnInit} from '@angular/core';
import {AuthService} from "./core/auth.service";
import {Router} from "@angular/router";
import {CustomIconService} from './core/custom-icon.service';

@Component({
  selector: 'jm-app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {

  constructor(
    private readonly router: Router,
    private readonly authService: AuthService,
    private customIconService: CustomIconService
  ) { }

  ngOnInit() {
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
