import { AuthConfig } from 'angular-oauth2-oidc';

export const getAuthConfig = (clientId: string, scope: string): AuthConfig => {
  return {
    issuer: 'https://accounts.google.com/o/oauth2/v2/auth',
    redirectUri: window.location.origin + '/index.html',
    clientId,
    scope,
    oidc: false
  }
}

