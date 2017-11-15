import {async} from '@angular/core/testing';
import {ResourceUtils} from "./resource-utils";


describe('ResourceUtils', () => {

  it('should get resource browser URL', async(() => {
    let utils = new ResourceUtils();
    expect(utils.getResourceBrowserURL('gs://test-bucket/input.txt'))
      .toEqual('https://console.cloud.google.com/storage/browser/test-bucket');
  }));

  it('should return invalid from invalid resource browser url', async(() => {
    let utils = new ResourceUtils();
    expect(utils.getResourceBrowserURL('/invalid/url'))
      .toBeUndefined();
  }));

  it('should get browser URL', async(() => {
    let utils = new ResourceUtils();
    expect(utils.getResourceURL('gs://test-bucket/input.txt'))
      .toEqual('https://storage.cloud.google.com/test-bucket/input.txt');
  }));

  it('should return invalid from invalid resource URL', async(() => {
    let utils = new ResourceUtils();
    expect(utils.getResourceURL('/invalid/url'))
      .toBeUndefined();
  }));

  it('should get file name from resource URL', async(() => {
    let utils = new ResourceUtils();
    expect(utils.formatValue('gs://test-bucket/input.txt'))
      .toEqual('input.txt');
  }));

});
