import {Component, Inject, OnInit} from "@angular/core";
import {MAT_DIALOG_DATA} from "@angular/material";

@Component({
  selector: 'jm-resource-contents-component',
  templateUrl: 'resource-contents.component.html',
  styleUrls: ['resource-contents.component.css']
})
export class JobResourceContentsComponent implements OnInit{
  resourceJson: object;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any) { }

  ngOnInit(): void {
    if (this.data.resourceType && this.data.resourceType == 'json') {
      this.resourceJson = JSON.parse(this.data.resourceContents);
    }
  }
}
