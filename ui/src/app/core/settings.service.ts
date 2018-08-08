import {Injectable} from '@angular/core';
import {AuthService} from '../core/auth.service';
import {CapabilitiesService} from "./capabilities.service";
import {DisplayField} from "../shared/model/DisplayField";

type Settings = {
  // Unset for basic auth users
  user: string
  // Unset for non-project-based job manager
  project: string
  v1: {
    displayColumns: DisplayField[]
  }
};

@Injectable()
export class SettingsService {
  currentSettings: Settings;

  constructor(
    private readonly authService: AuthService,
    private readonly capabilitiesService: CapabilitiesService,
    private readonly localStorage: Storage
  ) {
    this.currentSettings = JSON.parse(this.localStorage.getItem('settings'));
    if (this.currentSettings === null) {
      const capabilities = this.capabilitiesService.getCapabilitiesSynchronous();
      this.currentSettings = {
        'user' : null,
        'project' : null,
        'v1': { 'displayColumns': capabilities.displayFields } };
      this.updateLocalStorage();
    }
  }

  public getDisplayColumns(): DisplayField[] {
    return this.currentSettings.v1.displayColumns;
  }

  public setDisplayColumn(df: DisplayField, value: boolean): DisplayField[] {
    this.currentSettings.v1.displayColumns.forEach((field) => {
      if (df == field) {
        field.showInListView = value;
        return;
      }
    });
    this.updateLocalStorage();
    return this.currentSettings.v1.displayColumns;
  }

  private updateLocalStorage() {
    return this.localStorage.setItem('settings', JSON.stringify(this.currentSettings));
  }
}
