import {NgModule, Optional, SkipSelf} from '@angular/core';

import {AuthActivator} from "./auth-activator.service"
import {AuthService} from "./auth.service"
import {JobMonitorService} from './job-monitor.service';
import {SearchComponent} from './search/search.component';

/** Provides all of the common singleton components and services that can be
 *  shared across the app and should only ever be instantiated once. */
@NgModule({
  imports: [],
  declarations: [SearchComponent],
  exports: [],
  providers: [AuthActivator, AuthService, JobMonitorService]
})
export class CoreModule {
  constructor( @Optional() @SkipSelf() parentModule: CoreModule) {
    this.throwIfAlreadyLoaded(parentModule, 'CoreModule');
  }

  // Ensures the CoreModule is never imported twice
  private throwIfAlreadyLoaded(parentModule: any, moduleName: string) {
    if (parentModule) {
      throw new Error(`${moduleName} has already been loaded. Import Core modules in the AppModule only.`);
    }
  }
}
