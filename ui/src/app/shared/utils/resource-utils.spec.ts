import {waitForAsync} from '@angular/core/testing';
import {ResourceUtils} from "./resource-utils";


describe('ResourceUtils', () => {

  it('should get resource browser URL', waitForAsync(() => {
    expect(ResourceUtils.getResourceBrowserURL('gs://test-bucket/input.txt'))
      .toEqual('https://console.cloud.google.com/storage/browser/test-bucket?prefix=input.txt');
  }));

  it('should return invalid from invalid resource browser url', waitForAsync(() => {
    expect(ResourceUtils.getResourceBrowserURL('/invalid/url'))
      .toBeUndefined();
  }));

  it('should get browser URL', waitForAsync(() => {
    expect(ResourceUtils.getResourceURL('gs://test-bucket/input.txt'))
      .toEqual('https://storage.cloud.google.com/test-bucket/input.txt');
  }));

  it('should return invalid from invalid resource URL', waitForAsync(() => {
    expect(ResourceUtils.getResourceURL('/invalid/url'))
      .toBeUndefined();
  }));

  it('should get file name from resource URL', waitForAsync(() => {
    expect(ResourceUtils.getResourceFileName('gs://test-bucket/input.txt'))
      .toEqual('input.txt');
  }));

  it('should return resource URL if path is bucket or folder', waitForAsync(() => {
    expect(ResourceUtils.getResourceFileName('gs://test-bucket'))
      .toEqual('gs://test-bucket');
    expect(ResourceUtils.getResourceFileName('gs://test-bucket/not/root/'))
      .toEqual('gs://test-bucket/not/root/');
  }));

});
