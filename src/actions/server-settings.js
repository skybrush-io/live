/**
 * @file Action factories related to the dialog that shows the server settings.
 */

import { createAction } from 'redux-actions';
import {
  CLOSE_SERVER_SETTINGS_DIALOG,
  DISCONNECT_FROM_SERVER,
  SET_SERVER_SETTINGS_DIALOG_TAB,
  SHOW_SERVER_SETTINGS_DIALOG,
  UPDATE_SERVER_SETTINGS
} from './types';

/**
 * Action factory that creates an action that will close the server settings
 * dialog and optionally update the current server settings from the payload.
 */
export const closeServerSettingsDialog = createAction(
  CLOSE_SERVER_SETTINGS_DIALOG
);

/**
 * Action factory that creates an action that will disconnect from the
 * current server that we are connected to.
 */
export const disconnectFromServer = createAction(DISCONNECT_FROM_SERVER);

/**
 * Action factory that creates an action that will set the selected tab in the
 * server settings dialog.
 */
export const setServerSettingsDialogTab = createAction(
  SET_SERVER_SETTINGS_DIALOG_TAB
);

/**
 * Action factory that creates an action that shows the server settings dialog.
 */
export const showServerSettingsDialog = createAction(
  SHOW_SERVER_SETTINGS_DIALOG
);

/**
 * Action factory that creates an action that will update the current server
 * settings from the payload without affecting whether the server settings
 * dialog is visible or not.
 */
export const updateServerSettings = createAction(UPDATE_SERVER_SETTINGS);
