import { Injectable } from '@angular/core';

@Injectable()
export class ConfigLoaderService {
  private environmentConfig: object;
  private environmentConfigPromise: Promise<any>;

  constructor() { }

  private static loadJSONAsync(rawText:string): Promise<any> {
    return Promise.resolve(rawText).then(JSON.parse);
  }

  getEnvironmentConfig(): Promise<any> {
    if (this.environmentConfig) {
      return Promise.resolve(this.environmentConfig);
    }

    if (!this.environmentConfigPromise) {
      this.environmentConfigPromise = new Promise<any>((resolve, reject) => {
        const xmr = new XMLHttpRequest(),
          method = 'GET',
          url = '../../../assets/environments/environment.json';

        xmr.open(method, url, true);

        xmr.onload = () => {
          if (xmr.status === 200) {
            ConfigLoaderService.loadJSONAsync(xmr.responseText)
              .catch(SyntaxError => console.log(SyntaxError))
              .then(parsedConfig => resolve(parsedConfig));
          } else {
            reject({
              //TODO(Rex): Show err with snackBar
              message: "Cannot find the environment configuration file",
              status: xmr.status,
              statusText: xmr.statusText
            })
          }
        };

        //TODO(Rex): Show err with snackBar
        xmr.onerror = () => {reject("Fail to load the environment configuration file.")};

        xmr.send();
      })
        //TODO(Rex): Show err with snackBar and stop app peacefully
        .catch(err => {console.log(err);})
        .then(parsedConfig => {
          this.environmentConfig = parsedConfig;
          return this.environmentConfig;
        });
    }
    return this.environmentConfigPromise;
  }

  getEnvironmentConfigSynchronous(): object {
    if (this.environmentConfig) {
      return this.environmentConfig;
    }
    throw new Error("environmentConfig has not been loaded yet.");
  }
}
