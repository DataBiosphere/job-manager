import {Component, Input, OnInit} from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

import {AuthService} from '../../../core/auth.service';
import {ResourceUtils} from "../../../shared/utils/resource-utils";

@Component({
  selector: 'jm-debug-icons',
  templateUrl: './debug-icons.component.html',
  styleUrls: ['./debug-icons.component.css']
})
export class JobDebugIconsComponent implements OnInit {
  @Input() displayMessage: boolean;
  @Input() message: string;
  @Input() stdout: string;
  @Input() stderr: string;
  @Input() directory: string;

  constructor(private authService: AuthService,
              private sanitizer:DomSanitizer) {
  }

  ngOnInit() {
    // mark URLs as safe
  }

  getResourceUrl(url: string): SafeUrl {
    if (!url) {
      return '';
    }
    return this.sanitizer.bypassSecurityTrustResourceUrl(ResourceUtils.getResourceBrowserURL(url, this.authService.userEmail));
  }

  getTaskDirectory(directory): SafeUrl {
    if (directory) {
      return this.sanitizer.bypassSecurityTrustResourceUrl(ResourceUtils.getDirectoryBrowserURL(directory, this.authService.userEmail));
    }
  }
}
