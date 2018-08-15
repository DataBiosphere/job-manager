import {Inject, Injectable} from '@angular/core';
import {AuthService} from '../core/auth.service';
import {STORAGE_REF} from "../shared/common";

type Settings = {
  v1: {
    // set to '' for basic auth users
    userId: string
    projects: ProjectSettings[]
  }
};

type ProjectSettings = {
  // set to '' for non-project-based job manager
  projectId: string,
  displayColumns: string[]
  // ... other browser-based settings to be saved go here
}

@Injectable()
export class SettingsService {
  currentSettings: Settings;

  /** If there are saved browser settings for the current user (or for '' if none) get them;
   * otherwise, empty out the browser settings, set up a clean scaffolding and save that */
  constructor(
    private readonly authService: AuthService,
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

  /** return the display columns settings for a project or a clean scaffolding, if they don't exist */
  getDisplayColumns(projectId: string): string[] {
    let settings = this.getSettingsForProject(projectId);
    if (!settings) {
      settings = this.createEmptySettingsForProject(projectId);
    }
    return settings.displayColumns;
  }

  /** update the display columns settings for a project */
  setDisplayColumns(fields: string[], projectId: string): void {
    this.currentSettings.v1.projects.forEach((p) => {
      if (p.projectId === projectId) {
        p.displayColumns = fields;
        return;
      }
    });
    this.updateLocalStorage();
  }

  private getSettingsForProject(projectId: string): ProjectSettings {
    return this.currentSettings.v1.projects.find(p => p.projectId === projectId);
  }

  private updateLocalStorage(): void {
    return this.localStorage.setItem('settings', JSON.stringify(this.currentSettings));
  }

  private createEmptySettingsForProject(projectId: string): ProjectSettings {
    this.currentSettings.v1.projects.push({
      'projectId': projectId,
      'displayColumns': []
    });
    this.updateLocalStorage();
    return this.getSettingsForProject(projectId);
  }
}
