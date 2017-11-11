/** A collection of enums and static functions. */

export enum JobStatusImage {
  Submitted = <any> 'https://www.gstatic.com/images/icons/material/system/1x/file_upload_grey600_24dp.png',
  Running = <any> 'https://www.gstatic.com/images/icons/material/system/1x/autorenew_grey600_24dp.png',
  Aborting = <any> 'https://www.gstatic.com/images/icons/material/system/1x/report_problem_grey600_24dp.png',
  Failed = <any> 'https://www.gstatic.com/images/icons/material/system/1x/close_grey600_24dp.png',
  Succeeded = <any> 'https://www.gstatic.com/images/icons/material/system/1x/done_grey600_24dp.png',
  Aborted = <any> 'https://www.gstatic.com/images/icons/material/system/1x/report_problem_grey600_24dp.png'
}

export enum StatusGroup {
  Active = <any> 'active',
  Failed = <any> 'failed',
  Completed = <any> 'completed'
}

export class LabelColumn {
  header: string;
  key: string;
}

export class ResourceUtils {
  browserPrefix: string = "https://console.cloud.google.com/storage/browser/";
  storagePrefix: string = "https://storage.cloud.google.com/";

  getResourceBrowserURL(uri: string): string {
    let parts = this.validateGcsURLGetParts(uri);
    // This excludes the object from the link to show the enclosing directory.
    // This is valid with wildcard glob (bucket/path/*) and directories
    // (bucket/path/dir/) as well, the * or empty string will be trimmed.
    return parts ? this.browserPrefix + parts.slice(2,-1).join("/") : undefined;
  }

  getResourceURL(uri: string): string {
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

  formatValue(value: string): string {
    let parts = this.validateGcsURLGetParts(value);
    let formattedValue = value;
    if (parts) {
      // display the file name instead of the full resourceURL
      formattedValue = parts[parts.length -1];
    }
    return formattedValue;
  };

  getDuration(start: Date, end: Date): String {
    let duration: number;
    if (end) {
      duration = end.getTime() - start.getTime();
    } else {
      duration = new Date().getTime() - start.getTime();
    }
    return Math.round(duration/3600000) + "h " +
      Math.round(duration/60000)%60 + "m";
  }

}
