import {enableProdMode} from '@angular/core';
import {platformBrowserDynamic} from '@angular/platform-browser-dynamic';

import {AppModule} from './app/app.module';
import {environment} from './environments/environment';
import { environmentLoader as environmentLoaderPromise } from './environments/environmentLoader';


environmentLoaderPromise.then(env => {
  if (env.production) {
    enableProdMode();
  }
  environment.apiUrl = env.apiUrl;
  environment.clientId = env.clientId;

  platformBrowserDynamic().bootstrapModule(AppModule)
    .catch(err => console.log(err));
});
