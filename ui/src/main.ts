import {enableProdMode} from '@angular/core';
import {platformBrowserDynamic} from '@angular/platform-browser-dynamic';

import {AppModule} from './app/app.module';
import {environment} from './environments/environment';
import { ConfigurationLoader as configurationLoaderPromise } from './environments/configurationLoader';


if (environment.production) {
  enableProdMode();
}

configurationLoaderPromise.then(env => {
  Object.entries(env).forEach(([key, value]) => {
    environment[key] = value;
  });

  platformBrowserDynamic().bootstrapModule(AppModule)
    .catch(err => console.log(err));
});
