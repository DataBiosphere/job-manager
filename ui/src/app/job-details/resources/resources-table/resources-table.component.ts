import {
  Component,
  Input,
  OnInit,
} from '@angular/core';

import {AuthService} from '../../../core/auth.service';
import {ResourceUtils} from '../../../shared/utils/resource-utils';


@Component({
  selector: 'jm-resources-table',
  templateUrl: './resources-table.component.html',
  styleUrls: ['./resources-table.component.css'],
})
export class JobResourcesTableComponent implements OnInit {
  @Input() entries: Object;
  entryKeys: Array<string>;

  constructor(private authService: AuthService) {}

  ngOnInit() {
    this.entryKeys = Object.keys(this.entries || {}).sort();
  }

  getResourceURL(key: string): string {
    return ResourceUtils.getResourceBrowserURL(this.entries[key], this.authService.userEmail);
  }

  isResourceURL(key: string): boolean {
    return ResourceUtils.isResourceURL(this.entries[key]);
  }
}
