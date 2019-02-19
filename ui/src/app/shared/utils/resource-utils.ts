/** Utilities for formatting links to folders/files on google cloud storage. */
export class ResourceUtils {
  static browserPrefix: string = 'https://console.cloud.google.com/storage/browser/';
  static storagePrefix: string = 'https://storage.cloud.google.com/';

  /** Return boolean indicating if the value is a GCS url to a resource */
  public static isResourceURL(value: string): boolean {
    return !!ResourceUtils.validateGcsURLGetParts(value);
  }

  /** Get link to a file's enclosing directory from its gcs url */
  public static getResourceBrowserURL(url: string, user?: string): string {
    const parts = ResourceUtils.validateGcsURLGetParts(url);
    // This excludes the object from the link to show the enclosing directory.
    // This is valid with wildcard glob (bucket/path/*) and directories
    // (bucket/path/dir/) as well, the * or empty string will be trimmed.
    if (!parts) {
      return undefined;
    }

    let browserUrl = ResourceUtils.browserPrefix + parts.slice(2,-1).join('/');
    const params = new URLSearchParams();
    if (url.indexOf('*') == -1) {
      params.set('prefix', ResourceUtils.getResourceFileName(url));
    }
    if (user) {
      params.set('authuser', user);
    }
    if (params.toString()) {
      browserUrl += '?' + params.toString();
    }
    return browserUrl;
  }

  /** Get link to a directory from its gcs url */
  public static getDirectoryBrowserURL(url: string, user?: string): string {
    const parts = ResourceUtils.validateGcsURLGetParts(url);
    if (!parts) {
      return undefined;
    }
    var browserUrl = ResourceUtils.browserPrefix + parts.slice(2, -1).join('/');
    browserUrl += '/' + ResourceUtils.getResourceFileName(url) + '/';
    if (user) {
      browserUrl += '?authuser=' + user;
    }
    return browserUrl;
  }

  /** Get link to a file/folder from its gcs url */
  public static getResourceURL(url: string, user?: string): string {
    const parts = ResourceUtils.validateGcsURLGetParts(url);
    if (!parts) {
      return undefined;
    }
    let browserUrl = ResourceUtils.storagePrefix + parts.slice(2).join('/');
    if (user) {
      browserUrl += '?authuser=' + user;
    }
    return browserUrl;
  }

  /** Parse file name from gs link */
  public static getResourceFileName(url: string): string {
    const parts = ResourceUtils.validateGcsURLGetParts(url);
    let formattedValue = url;
    if (parts && parts.length > 3 &&
        parts[parts.length - 1] &&
        parts[parts.length - 1].indexOf('*') == -1) {
      // display the file name instead of the full resourceURL
      formattedValue = parts[parts.length - 1];
    }
    return formattedValue;
  };

  public static getResourceBucket(url: string): string {
    const parts = ResourceUtils.validateGcsURLGetParts(url);
    return parts[2];
  }

  public static getResourceObject(url: string): string {
    const parts = ResourceUtils.validateGcsURLGetParts(url);
    if (parts.length >= 3) {
      // Encode URI paths so the object can be posted to the cloud storage API:
      // https://cloud.google.com/storage/docs/json_api/#encoding
      return encodeURIComponent(parts.slice(3).join('/'));
    }
    return "";
  }

  /** Validate that the url is a gcs url and return the url parts */
  private static validateGcsURLGetParts(url: string): string[] {
    if (typeof(url) !== 'string') {
      return;
    }
    const parts = url.split('/');
    if (parts[0] != 'gs:' || parts[1] != '') {
      // TODO(bryancrampton): Handle invalid resource URL gracefully
      return;
    }
    return parts;
  }
}
