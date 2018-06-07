import {enableProdMode} from '@angular/core';
import {platformBrowserDynamic} from '@angular/platform-browser-dynamic';

import {AppModule} from './app/app.module';
import {environment} from './environments/environment';
import { ConfigurationLoader as configurationLoaderPromise } from './environments/configurationLoader';


if (environment.production) {
  enableProdMode();
}

configurationLoaderPromise
  .catch((err) => {
    //TODO: Stop the app from moving forward here and show error about retrieving the file (snackBar(err))
  })
  .then((envfile) => {
    return JSON.parse(envfile);
  })
  .catch((SyntaxError) => {
    console.log(SyntaxError); // TODO: should stop the app here and show error about parsing the content snackBar(SyntaxError)
  })
  .then((env) => {
    Object.entries(env).forEach(([key, value]) => {
      environment[key] = value;
    });

    platformBrowserDynamic().bootstrapModule(AppModule)
      .catch(err => console.log(err));
  });


