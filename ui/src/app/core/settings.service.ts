import {Injectable} from '@angular/core';
import {AuthService} from '../core/auth.service';
import {CapabilitiesService} from "./capabilities.service";
import {DisplayField} from "../shared/model/DisplayField";

type Settings = {
  v1: {
    // set to '' for basic auth users
    userId: string
    // set to '' for non-project-based job manager
    projects: ProjectSettings[]
  }
};

type ProjectSettings = {
  projectId: string,
  displayColumns: DisplayField[]
  // ... other browser-based settings to be saved go here
}


@Injectable()
export class SettingsService {
  currentSettings: Settings;

  /** If there are browser settings for the current user (or for '' if none) get them;
   * otherwise, empty out the browser settings and set up a clean scaffolding */
  constructor(
    private readonly authService: AuthService,
    private readonly capabilitiesService: CapabilitiesService,
    private readonly localStorage: Storage
  ) {
    const savedSettings = JSON.parse(this.localStorage.getItem('settings'));
    if ((authService.userId && savedSettings && (savedSettings.v1.userId == this.authService.userId))
      || !authService.userId && savedSettings && savedSettings.v1.userId === '') {
      this.currentSettings = savedSettings;
    } else {
      this.localStorage.setItem('settings', JSON.stringify(''));

      let currentUser = '';
      if (authService.userId) {
        currentUser = this.authService.userId;
      }
      const projectSettings: ProjectSettings[] = [];
      this.currentSettings = {
        'v1': {
          'userId' : currentUser,
          'projects': projectSettings} };
      this.updateLocalStorage();
    }
  }

  /** return the display columns settings for a project, or if they don't exist, set all
   * possible columns from capabilities service to be displayed and return that */
  public getDisplayColumns(projectId = ''): DisplayField[] {
    if (this.getSettingsForProject(projectId) && this.getSettingsForProject(projectId).displayColumns) {
      return this.getSettingsForProject(projectId).displayColumns;
    }
    const cleanDisplayColumns = this.getDefaultDisplayFieldSettings();
    this.currentSettings.v1.projects =[{
      'projectId': projectId,
      'displayColumns': cleanDisplayColumns
    } as ProjectSettings];
    this.updateLocalStorage();
    return cleanDisplayColumns;
  }

  /** update the display columns settings for a project and return the updated array */
  public setDisplayColumnVisibility(projectId = '', df: DisplayField, value: boolean): DisplayField[] {
    let displayColumns = this.getDefaultDisplayFieldSettings();
    this.currentSettings.v1.projects.forEach((p) => {
      if (p.projectId === projectId) {
        p.displayColumns.forEach((field) => {
          if (df == field) {
            field.showInListView = value;
            return;
          }
        })
        displayColumns = p.displayColumns;
        return;
      }
    });
    this.updateLocalStorage();
    return displayColumns;
  }

  public getSettingsForProject(projectId = ''): ProjectSettings {
    let settings: ProjectSettings = null;
    this.currentSettings.v1.projects.forEach((p) => {
      if (p.projectId === projectId) {
        settings = p;
        return;
      }
    });
    return settings;
  }

  private getDefaultDisplayFieldSettings(): DisplayField[] {
    let capabilities = this.capabilitiesService.getCapabilitiesSynchronous();
    capabilities.displayFields.forEach((field) => {
      field.showInListView = true;
    });
    return capabilities.displayFields;
  }

  private updateLocalStorage(): void {
    return this.localStorage.setItem('settings', JSON.stringify(this.currentSettings));
  }
}
