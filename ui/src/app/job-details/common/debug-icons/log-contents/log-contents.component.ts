import {Component, Inject} from "@angular/core";
import {MAT_DIALOG_DATA} from "@angular/material";
import {AuthService} from "../../../../core/auth.service";

@Component({
  selector: 'jm-log-contents-component',
  templateUrl: 'log-contents.component.html',
  styleUrls: ['log-contents.component.css']
})
export class JobLogContentsComponent {

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any) {
  }
}
