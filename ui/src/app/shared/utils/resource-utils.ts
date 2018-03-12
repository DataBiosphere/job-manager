/** Utilities for formatting links to folders/files on google cloud storage. */
export class ResourceUtils {
  static browserPrefix: string = "https://console.cloud.google.com/storage/browser/";
  static storagePrefix: string = "https://storage.cloud.google.com/";

  /** Return boolean indicating if the value is a GCS url to a resource */
  public static isResourceURL(value: string): boolean {
    return !!ResourceUtils.validateGcsURLGetParts(value);
  }

  /** Get link to a file's enclosing directory from its gcs url */
  public static getResourceBrowserURL(url: string): string {
    let parts = ResourceUtils.validateGcsURLGetParts(url);
    // This excludes the object from the link to show the enclosing directory.
    // This is valid with wildcard glob (bucket/path/*) and directories
    // (bucket/path/dir/) as well, the * or empty string will be trimmed.
    var browserUrl = parts
      ? ResourceUtils.browserPrefix + parts.slice(2,-1).join("/")
      : undefined;
    if (url.indexOf('*') == -1) {
      browserUrl += "?prefix=" + ResourceUtils.getResourceFileName(url);
    }
    return browserUrl;
  }

  /** Get link to a file/folder from its gcs url */
  public static getResourceURL(url: string): string {
    let parts = ResourceUtils.validateGcsURLGetParts(url);
    return parts
      ? ResourceUtils.storagePrefix + parts.slice(2).join("/")
      : undefined;
  }

  /** Validate that the url is a gcs url and return the url parts */
  private static validateGcsURLGetParts(url: string): string[] {
    if (typeof(url) !== 'string') {
      return;
    }
    let parts = url.split("/");
    if (parts[0] != "gs:" || parts[1] != "") {
      // TODO(bryancrampton): Handle invalid resource URL gracefully
      return;
    }
    return parts;
  }

  /** Parse file name from gs link */
  public static getResourceFileName(url: string): string {
    let parts = ResourceUtils.validateGcsURLGetParts(url);
    let formattedValue = url;
    if (parts && parts.length > 3 &&
        parts[parts.length - 1] &&
        parts[parts.length - 1].indexOf('*') == -1) {
      // display the file name instead of the full resourceURL
      formattedValue = parts[parts.length - 1];
    }
    return formattedValue;
  };
}
