import { environment as defaultEnvironment } from './environment';

export const ConfigurationLoader = new Promise<any>((resolve, reject) => {

  const xmlhttp = new XMLHttpRequest(),
    method = 'GET',
    url = './assets/environments/environment.json';

  xmlhttp.open(method, url, true);

  xmlhttp.onload = event => {

    if (xmlhttp.status === 200) {
      resolve(
        xmlhttp.responseText
      )
    } else {
      reject("err_msg") // log for debugging TODO: show err msg: fail to load the file
    }

  };

  xmlhttp.onerror = event => {
    reject("err_msg"); // log for debugging TODO: show err msg: fail to load the file
  };

  xmlhttp.send();
});
