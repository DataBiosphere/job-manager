import { environment as defaultEnvironment } from './environment';

export const ConfigurationLoader = new Promise<any>(resolve => {

  let xmlhttp = new XMLHttpRequest(),
    method = 'GET',
    url = './assets/environments/environment.json';

  xmlhttp.open(method, url, true);

  xmlhttp.onload = () => {
    if (xmlhttp.status === 200) {
      resolve(JSON.parse(xmlhttp.responseText));
    } else {
      resolve(defaultEnvironment);
    }
  };

  xmlhttp.send();
});
