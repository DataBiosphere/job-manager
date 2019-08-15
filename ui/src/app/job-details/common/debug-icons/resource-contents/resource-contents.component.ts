import {Component, Inject, OnInit, ViewChild} from "@angular/core";
import {MAT_DIALOG_DATA} from "@angular/material";
import {NgxJsonViewerComponent} from "ngx-json-viewer";

@Component({
  selector: 'jm-resource-contents-component',
  templateUrl: 'resource-contents.component.html',
  styleUrls: ['resource-contents.component.css']
})
export class JobResourceContentsComponent implements OnInit{
  resourceJson: object;
  @ViewChild('jsonViewer') jsonViewer: NgxJsonViewerComponent;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any) { }

  ngOnInit(): void {
    if (this.data.resourceType && this.data.resourceType == 'json') {
      this.resourceJson = JSON.parse(this.data.resourceContents);
    }
  }

  expandJson(): void {
    if (this.jsonViewer) {
      this.jsonViewer.expanded = true;
      this.jsonViewer.ngOnChanges();
    }
  }

  isExpanded(): boolean {
    return this.jsonViewer && this.jsonViewer.expanded;
  }
}
