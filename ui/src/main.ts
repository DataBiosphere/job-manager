import {enableProdMode, ReflectiveInjector} from '@angular/core';
import {platformBrowserDynamic} from '@angular/platform-browser-dynamic';

import {AppModule} from './app/app.module';
import {environment} from './environments/environment';
import {EnvironmentConfigurationLoaderService} from "./environments/environment-configuration-loader.service";

if (environment.production) {
  enableProdMode();
}

let environmentConfigurationLoader = ReflectiveInjector
  .resolveAndCreate([EnvironmentConfigurationLoaderService])
  .get(EnvironmentConfigurationLoaderService)

environmentConfigurationLoader.getEnvironmentConfig()
  .then(environmentConfig => {
    console.log("The loaded env config is: ");
    console.log(environmentConfig);
    console.log("The env config stored in the singleton is: ");
    console.log(environmentConfigurationLoader.getEnvironmentConfigSynchronous());

    platformBrowserDynamic([{
      provide: EnvironmentConfigurationLoaderService, useValue: environmentConfigurationLoader
    }])
      .bootstrapModule(AppModule).catch(err => console.log(err));
});
