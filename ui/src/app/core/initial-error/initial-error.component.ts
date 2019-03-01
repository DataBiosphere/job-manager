import {Component} from '@angular/core';
import {Location} from '@angular/common';
import {NavigationError, Router} from '@angular/router';

@Component({
  selector: 'jm-initial-error',
  templateUrl: './initial-error.component.html',
  styleUrls: ['./initial-error.component.css']
})
export class InitialErrorComponent {
  errorMessage: string;
  newUrl: string;
  linkText: string;
  initialLoadFailure = false;

  constructor(router: Router, loc: Location) {
    router.events.subscribe((e) => {
      if (e instanceof NavigationError && !router.navigated) {
        // Hack: On navigation failure, Angular strips the path from the URL.
        // This is undesirable in the event of a 500/503 on initial load refresh
        // the page, or on other errors where the user may want to inspect the
        // URL. Restore the URL here; luckily this doesn't cause another Angular
        // Router nagivate.
        loc.replaceState(e.url);
        this.initialLoadFailure = true;
        const status = e.error.status || 'unknown';
        const title = e.error.title || 'Unknown error';
        this.errorMessage = `${status}: ${title}`;

        if (status == '401') {
          this.newUrl = '/sign_in';
          this.linkText = 'Click here to log in.'
        } else {
          this.newUrl = '/';
          this.linkText = 'Click here to start over.';
        }
      }
      if (router.navigated) {
        // In the event that one of our resolvers/activators did another
        // navigate on failure, hide the error. Unexpected and not ideal as we'd
        // briefly flash the error html on screen.
        this.initialLoadFailure = false;
      }
    });
  }
}
