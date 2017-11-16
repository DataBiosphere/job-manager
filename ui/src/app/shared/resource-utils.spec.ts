import {async} from '@angular/core/testing';
import {ResourceUtils} from "./resource-utils";


describe('ResourceUtils', () => {

  it('should get resource browser URL', async(() => {
    expect(ResourceUtils.getResourceBrowserURL('gs://test-bucket/input.txt'))
      .toEqual('https://console.cloud.google.com/storage/browser/test-bucket');
  }));

  it('should return invalid from invalid resource browser url', async(() => {
    expect(ResourceUtils.getResourceBrowserURL('/invalid/url'))
      .toBeUndefined();
  }));

  it('should get browser URL', async(() => {
    expect(ResourceUtils.getResourceURL('gs://test-bucket/input.txt'))
      .toEqual('https://storage.cloud.google.com/test-bucket/input.txt');
  }));

  it('should return invalid from invalid resource URL', async(() => {
    expect(ResourceUtils.getResourceURL('/invalid/url'))
      .toBeUndefined();
  }));

  it('should get file name from resource URL', async(() => {
    expect(ResourceUtils.getResourceFileName('gs://test-bucket/input.txt'))
      .toEqual('input.txt');
  }));

});
