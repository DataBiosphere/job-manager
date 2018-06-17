import {enableProdMode, ReflectiveInjector} from '@angular/core';
import {platformBrowserDynamic} from '@angular/platform-browser-dynamic';

import {AppModule} from './app/app.module';
import {environment} from './environments/environment';
import {ConfigLoaderService} from "./environments/config-loader.service";

if (environment.production) {
  enableProdMode();
}

let configLoader = ReflectiveInjector
  .resolveAndCreate([ConfigLoaderService])
  .get(ConfigLoaderService);

configLoader.getEnvironmentConfig()
  //TODO(Rex): Show err with snackBar(optional) and stop app peacefully
  .catch(err => console.log(err))
  .then(() => {
    platformBrowserDynamic([{
      provide: ConfigLoaderService, useValue: configLoader
    }])
      .bootstrapModule(AppModule).catch(err => console.log(err));
});
