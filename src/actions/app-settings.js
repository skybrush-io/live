/**
 * @file Action factories related to updating the settings of the app.
 */

import { createAction } from 'redux-actions';
import {
  CLOSE_APP_SETTINGS_DIALOG,
  SET_APP_SETTINGS_DIALOG_TAB,
  SHOW_APP_SETTINGS_DIALOG,
  TOGGLE_APP_SETTINGS_DIALOG
} from './types';

/**
 * Action factory that creates an action that will close the app settings
 * dialog.
 */
export const closeAppSettingsDialog = createAction(CLOSE_APP_SETTINGS_DIALOG);

/**
 * Action factory that creates an action that will set the selected tab
 * in the app settings dialog.
 */
export const setAppSettingsDialogTab = createAction(
  SET_APP_SETTINGS_DIALOG_TAB
);

/**
 * Action factory that creates an action that shows the app settings dialog.
 */
export const showAppSettingsDialog = createAction(
  SHOW_APP_SETTINGS_DIALOG,
  () => null
);

/**
 * Action factory that creates an action that toggles the visibility of
 * the app settings dialog.
 */
export const toggleAppSettingsDialog = createAction(
  TOGGLE_APP_SETTINGS_DIALOG,
  () => null
);
