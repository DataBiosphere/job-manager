import {Injectable} from '@angular/core';
import {AuthService} from '../core/auth.service';


type Settings = {
  // Unset for basic auth users
  user: string
  // Unset for non-project-based job manager
  project: string
  v1: {
    displayColumns: string[]
  }
};

@Injectable()
export class SettingsService {
  constructor(
    private readonly authService: AuthService,
    private readonly localStorage: Storage
  ) {}

  public get(): Settings {
    return JSON.parse(this.localStorage.getItem('settings')) as Settings;
  }

  public set(s: Settings) {
    return this.localStorage.setItem('settings', JSON.stringify(s));
  }
}
