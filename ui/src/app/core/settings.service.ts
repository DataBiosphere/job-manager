import {Inject, Injectable} from '@angular/core';
import {AuthService} from '../core/auth.service';
import {FieldDataType, queryExtensionsDataTypes, STORAGE_REF} from "../shared/common";
import {CapabilitiesService} from "./capabilities.service";

type Settings = {
  v1: {
    // set to '' for basic auth users
    userId: string
    projects: ProjectSettings[]
  }
};

export type ProjectSettings = {
  // set to '' for non-project-based job manager
  projectId: string,
  displayColumns: string[],
  pageSize: number,
  hideArchived: boolean
  // ... other browser-based settings to be saved go here
}

@Injectable()
export class SettingsService {
  currentSettings: Settings;

  /** If there are saved browser settings for the current user (or for '' if none) get them;
   * otherwise, empty out the browser settings, set up a clean scaffolding and save that */
  constructor(
    private readonly authService: AuthService,
    private readonly capabilitiesService: CapabilitiesService,
    @Inject(STORAGE_REF) private readonly localStorage: Storage
  ) {
    const savedSettings = JSON.parse(this.localStorage.getItem('settings'));
    let currentUser = authService.userId || '';
    if (savedSettings && (savedSettings.v1.userId === currentUser)) {
      this.currentSettings = savedSettings;
    } else {
      this.currentSettings = {
        v1: {
          'userId': currentUser,
          'projects' : []
        }
      };
      this.updateLocalStorage();
    }
  }

  getSavedSettingValue(settingKey: string, projectId: string): any {
    const settings = this.getSettingsForProject(projectId);
    for (let key in settings) {
      if (key == settingKey) {
        return settings[key];
      }
    }

    // if there is no project setting key for a requested and configured query extension,
    // return a default value that can be updated via the UI
    const capabilities = this.capabilitiesService.getCapabilitiesSynchronous();
    if (capabilities.queryExtensions && capabilities.queryExtensions.includes(settingKey)) {
      let dataType = queryExtensionsDataTypes.get(settingKey);
      if (dataType == FieldDataType.Boolean) {
        return false;
      }
    }
    return null;
  }

  setSavedSettingValue(settingKey: string, value: any, projectId: string): void {
    let updated: boolean = false;
    this.currentSettings.v1.projects.forEach(project => {
      if (project.projectId === projectId) {
        project[settingKey] = value;
        updated = true;
        return;
      }
    });
    this.updateLocalStorage();
  }

  getSettingsForProject(projectId: string): ProjectSettings {
    let settings = this.currentSettings.v1.projects.find(p => p.projectId === projectId);
    if (!settings) {
      settings = this.createEmptySettingsForProject(projectId);
    }
    return settings;
  }

  private updateLocalStorage(): void {
    return this.localStorage.setItem('settings', JSON.stringify(this.currentSettings));
  }

  private createEmptySettingsForProject(projectId: string): ProjectSettings {
    const capabilities = this.capabilitiesService.getCapabilitiesSynchronous();
    let hideArchived = null;
    if (capabilities.queryExtensions && capabilities.queryExtensions.includes('hideArchived')) {
      hideArchived = true;
    }
    this.currentSettings.v1.projects.push({
      projectId: projectId,
      displayColumns: null,
      pageSize: null,
      hideArchived: hideArchived
    });
    this.updateLocalStorage();
    return this.getSettingsForProject(projectId);
  }
}
