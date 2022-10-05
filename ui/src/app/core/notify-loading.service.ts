import {
  Injectable,
  NgZone,
} from '@angular/core';
import {
  Event as RouterEvent,
  NavigationCancel,
  NavigationEnd,
  NavigationError,
  NavigationStart,
  Router,
} from '@angular/router';
import {MatSnackBar, MatSnackBarRef, SimpleSnackBar} from '@angular/material/snack-bar';

@Injectable()
export class NotifyLoadingService {
  private snackBarRef: MatSnackBarRef<SimpleSnackBar>;

  constructor(
    private zone: NgZone,
    private snackBar: MatSnackBar,
    router: Router,
  ) {
    router.events.subscribe((e: RouterEvent) => {
      if (e instanceof NavigationStart) {
        this.showSpinner();
      } else if (e instanceof NavigationEnd
                 || e instanceof NavigationError
                 || e instanceof NavigationCancel) {
        this.hideSpinner();
      }
    });
  }

  showSpinner() {
    this.zone.runOutsideAngular(() => {
      if (this.snackBarRef) {
        this.snackBarRef.dismiss();
      }
      this.snackBarRef = this.snackBar.open('Loading...');
    });
  }

  hideSpinner() {
    this.zone.runOutsideAngular(() => {
      if (this.snackBarRef) {
        this.snackBarRef.dismiss();
        this.snackBarRef = null;
      }
    });
  }
}
