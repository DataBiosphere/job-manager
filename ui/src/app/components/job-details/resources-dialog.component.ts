import {Component, Inject} from '@angular/core';
import {MdDialogRef, MAT_DIALOG_DATA} from '@angular/material';

@Component({
  selector: 'resources-dialog',
  templateUrl: 'resources-dialog.component.html',
  styleUrls: ['resources-dialog.component.css'],
})
export class ResourceDialogComponent {

  private gcsPrefix: string = "https://console.cloud.google.com/storage/browser/";
  private resourceKeys: Array<String>;
  private resources: Map<String, String>;

  constructor(
    public dialogRef: MdDialogRef<ResourceDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Map<String, String>) {
      this.resourceKeys = Array.from(data.keys());
      this.resources = data;
      dialogRef.afterClosed().subscribe(key => { this.openResource(key) });
   }

  onResourceClicked(key: string): void {
    this.dialogRef.close(key);
  }

  openResource(key: string): void {
    let resourceURLParts = this.resources.get(key).split("/");
    if (resourceURLParts[0] != "gs:" || resourceURLParts[1] != "") {
      // TODO(bryancrampton): Handle invalid resource URL gracefully
    }
    let resourceURL = this.gcsPrefix + resourceURLParts.slice(2,-1).join("/");
    window.open(resourceURL);
  }
}
