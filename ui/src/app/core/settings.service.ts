import {Inject, Injectable} from '@angular/core';
import {AuthService} from '../core/auth.service';
import {STORAGE_REF} from "../shared/common";
import {CapabilitiesService} from "./capabilities.service";

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

  /** return the display columns settings for a project or a clean scaffolding, if they don't exist */
  getDisplayColumns(projectId: string): string[] {
    return this.getSettingsForProject(projectId).displayColumns;
  }

  getPageSize(projectId: string): number {
    return this.getSettingsForProject(projectId).pageSize;
  }

  getHideArchived(projectId: string): boolean {
    return this.getSettingsForProject(projectId).hideArchived;
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

  setPageSize(pageSize: number, projectId: string): void {
    this.currentSettings.v1.projects.forEach((p) => {
      if (p.projectId === projectId) {
        p.pageSize = pageSize;
        return;
      }
    });
    this.updateLocalStorage();
  }

  setHideArchived(hideArchived: boolean, projectId: string): void {
    this.currentSettings.v1.projects.forEach((p) => {
      if (p.projectId === projectId) {
        p.hideArchived = hideArchived;
        return;
      }
    });
    this.updateLocalStorage();
  }

  private getSettingsForProject(projectId: string): ProjectSettings {
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
    this.currentSettings.v1.projects.push({
      projectId: projectId,
      displayColumns: null,
      pageSize: null,
      hideArchived: capabilities.queryExtensions.includes('hideArchived')
    });
    this.updateLocalStorage();
    return this.getSettingsForProject(projectId);
  }
}
