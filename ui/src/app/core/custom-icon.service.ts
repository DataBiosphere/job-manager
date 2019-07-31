import {DomSanitizer} from "@angular/platform-browser";
import {MatIconRegistry} from "@angular/material/icon";
import {Injectable} from "@angular/core";

@Injectable()
export class CustomIconService {
  constructor(
    private matIconRegistry: MatIconRegistry,
    private domSanitizer: DomSanitizer
  ) {
    this.matIconRegistry.addSvgIcon(
      'cloud-file',
      this.domSanitizer.bypassSecurityTrustResourceUrl('/assets/images/icon-cloud-file.svg')
    );
  }
}
