import { Injectable } from '@angular/core';

@Injectable()
export class EnvironmentConfigurationLoaderService {
  private environmentConfig: object;
  private environmentConfigPromise: Promise<any>;

  constructor() { }

  private static loadJSONAsync(rawText:string): Promise<object> {
    return Promise.resolve(JSON.parse(rawText));
  }

  getEnvironmentConfig(): Promise<any> {
    if (!this.environmentConfigPromise) {
      this.environmentConfigPromise = new Promise<any>((resolve, reject) => {
        const xmr = new XMLHttpRequest(),
          method = 'GET',
          url = '../../../assets/environments/environment.json';

        xmr.open(method, url, true);

        xmr.onload = () => {
          if (xmr.status === 200) {
            EnvironmentConfigurationLoaderService.loadJSONAsync(xmr.responseText)
              .catch(SyntaxError => console.log(SyntaxError))
              .then(parsedConfig => resolve(parsedConfig));
          } else {
            reject({
              message: "Cannot find the environment configuration file",
              status: xmr.status,
              statusText: xmr.statusText
            }) //Rex TODO: show error msg with snackBar
          }
        };

        xmr.onerror = () => {reject("Fail to load the environment configuration file.")};
        //Rex TODO: show error msg with snackBar

        xmr.send();
      })
        .catch(err => {console.log(err);}) //Rex TODO: show error msg with snackBar and stop application}
        .then(parsedConfig => {
          this.environmentConfig = parsedConfig;
          return this.environmentConfig;
        });
    }
    return this.environmentConfigPromise;
  }

  getEnvironmentConfigSynchronous(): object {
    if (this.environmentConfig) {
      console.log("Yahoo, hit the cache!!");
      return this.environmentConfig;
    }
    console.log("Oops there's nothing in the cache!!!");
    throw new Error("environmentConfig has not been loaded yet.")
  }
}
