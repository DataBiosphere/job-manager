import {SettingsService} from "../core/settings.service";
import {DisplayField} from "../shared/model/DisplayField";

export class FakeSettingsService extends SettingsService {
  constructor() {
    super(null, null, null);
    this.currentSettings = {
      v1: {
        userId: '',
        projects: [{
          projectId: '',
          displayColumns: [
            {field: 'status', display: 'Status'},
            {field: 'submission', display: 'Submitted'},
            {field: 'extensions.userId', display: 'User ID'},
          ]
        }
        ]
      }
    };
  }

  public getDisplayColumns(projectId = ''): DisplayField[] {
    return this.currentSettings.v1.projects[0].displayColumns;
  }
}
