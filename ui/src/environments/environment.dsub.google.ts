import {dsubAdditionalColumns} from './additional-columns.config';

export const environment = {
  apiUrl: '/api/v1',
  // Project ID: google.com:bvdp-jmui
  clientId: '738242158346-l0vdrjp6sdlg61ni5fm26m7nu75gql51.apps.googleusercontent.com',
  production: false,
  requiresAuth: true,
  scope: 'https://www.googleapis.com/auth/genomics https://www.googleapis.com/auth/cloudplatformprojects.readonly',
  additionalColumns: dsubAdditionalColumns,
  entryPoint: 'projects',
};
