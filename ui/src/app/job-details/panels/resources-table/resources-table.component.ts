import {
  Component,
  Input,
  OnChanges,
  SimpleChanges
} from '@angular/core';
import {ResourceUtils} from '../../../shared/utils/resource-utils';


@Component({
  selector: 'jm-resources-table',
  templateUrl: './resources-table.component.html',
  styleUrls: ['./resources-table.component.css'],
})
export class ResourcesTableComponent implements OnChanges {
  private readonly resourcesColumns: string[] = ["key", "value"];

  @Input() entries: Object;
  entryKeys: Array<string>;

  ngOnChanges(changes: SimpleChanges) {
    this.entryKeys = Object.keys(this.entries || {}).sort();
  }

  getResourceURL(key: string): string {
    return ResourceUtils.getResourceBrowserURL(this.entries[key]);
  }

  getResourceFileName(key: string): string {
    return ResourceUtils.getResourceFileName(this.entries[key]);
  }

  isResourceURL(key: string): boolean {
    return ResourceUtils.isResourceURL(this.entries[key]);
  }
}
