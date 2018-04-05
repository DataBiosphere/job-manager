import {NgModule, Optional, SkipSelf} from '@angular/core';
import {MatSnackBarModule} from '@angular/material';
import {BrowserModule} from '@angular/platform-browser';

import {CapabilitiesActivator} from "./capabilities-activator.service";
import {CapabilitiesService} from "./capabilities.service";
import {AuthService} from "./auth.service";
import {JobManagerService} from './job-manager.service';
import {NotifyLoadingService} from './notify-loading.service';
import {InitialErrorComponent} from "./initial-error/initial-error.component";

/** Provides all of the common singleton components and services that can be
 *  shared across the app and should only ever be instantiated once. */
@NgModule({
  imports: [
    BrowserModule,
    MatSnackBarModule,
  ],
  declarations: [
    InitialErrorComponent,
  ],
  exports: [
    InitialErrorComponent,
  ],
  providers: [
    AuthService,
    CapabilitiesActivator,
    CapabilitiesService,
    JobManagerService,
    NotifyLoadingService
  ]
})
export class CoreModule {
  constructor(@Optional() @SkipSelf() parentModule: CoreModule,
              notifyLoadingService: NotifyLoadingService) {
    // Inject NotifyLoadingService to force eager instantiation, as no
    // components depend on it. See https://github.com/dscheerens/ngx-eager-provider-loader/blob/master/eager-loading-in-angular-2.md
    this.throwIfAlreadyLoaded(parentModule, 'CoreModule');
  }

  // Ensures the CoreModule is never imported twice
  private throwIfAlreadyLoaded(parentModule: any, moduleName: string) {
    if (parentModule) {
      throw new Error(`${moduleName} has already been loaded. Import Core modules in the AppModule only.`);
    }
  }
}
