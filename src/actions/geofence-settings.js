/**
 * @file Action factories related to the dialog that shows the geofence settings.
 */

import { createAction } from 'redux-actions';
import {
  CLOSE_GEOFENCE_SETTINGS_DIALOG,
  SHOW_GEOFENCE_SETTINGS_DIALOG,
  UPDATE_GEOFENCE_SETTINGS,
} from './types';

/**
 * Action factory that creates an action that will close the geofence settings
 * dialog.
 */
export const closeGeofenceSettingsDialog = createAction(
  CLOSE_GEOFENCE_SETTINGS_DIALOG
);

/**
 * Action factory that creates an action that shows the geofence settings dialog.
 */
export const showGeofenceSettingsDialog = createAction(
  SHOW_GEOFENCE_SETTINGS_DIALOG,
  () => ({})
);

/**
 * Action factory that creates an action that will update the current geofence
 * settings from the payload without affecting whether the geofence settings
 * dialog is visible or not.
 */
export const updateGeofenceSettings = createAction(UPDATE_GEOFENCE_SETTINGS);
