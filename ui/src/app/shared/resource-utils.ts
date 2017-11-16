/**
 * Utilities for formatting links to folders/files on google cloud storage.
 */

export class ResourceUtils {
  browserPrefix: string = "https://console.cloud.google.com/storage/browser/";
  storagePrefix: string = "https://storage.cloud.google.com/";

  public getResourceBrowserURL(uri: string): string {
    let parts = this.validateGcsURLGetParts(uri);
    // This excludes the object from the link to show the enclosing directory.
    // This is valid with wildcard glob (bucket/path/*) and directories
    // (bucket/path/dir/) as well, the * or empty string will be trimmed.
    return parts ? this.browserPrefix + parts.slice(2,-1).join("/") : undefined;
  }

  public getResourceURL(uri: string): string {
    let parts = this.validateGcsURLGetParts(uri);
    return parts ? this.storagePrefix + parts.slice(2).join("/") : undefined;
  }

  private validateGcsURLGetParts(url: string): string[] {
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

  // Parse file name from gs link
  public getResourceFileName(value: string): string {
    let parts = this.validateGcsURLGetParts(value);
    let formattedValue = value;
    if (parts) {
      // display the file name instead of the full resourceURL
      formattedValue = parts[parts.length -1];
    }
    return formattedValue;
  };

}
