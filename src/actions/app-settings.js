/**
 * @file Action factories related to updating the settings of the app.
 */

import { createAction } from 'redux-actions'
import { CLOSE_APP_SETTINGS_DIALOG, REPLACE_APP_SETTINGS,
  SET_APP_SETTINGS_DIALOG_TAB, SHOW_APP_SETTINGS_DIALOG,
  TOGGLE_APP_SETTINGS_DIALOG, UPDATE_APP_SETTINGS } from './types'

/**
 * Action factory that creates an action that will replace all the
 * settings in a category with the given values.
 */
export const replaceAppSettings = createAction(
  REPLACE_APP_SETTINGS,
  (category, updates) => ({ category, updates })
)

/**
 * Action factory that creates an action that will update the given
 * new settings into a setting category.
 */
export const updateAppSettings = createAction(
  UPDATE_APP_SETTINGS,
  (category, updates) => ({ category, updates })
)

/**
 * Action factory that creates an action that will close the app settings
 * dialog.
 */
export const closeAppSettingsDialog = createAction(CLOSE_APP_SETTINGS_DIALOG)

/**
 * Action factory that creates an action that will set the selected tab
 * in the app settings dialog.
 */
export const setAppSettingsDialogTab = createAction(SET_APP_SETTINGS_DIALOG_TAB)

/**
 * Action factory that creates an action that shows the app settings dialog.
 */
export const showAppSettingsDialog = createAction(SHOW_APP_SETTINGS_DIALOG)

/**
 * Action factory that creates an action that toggles the visibility of
 * the app settings dialog.
 */
export const toggleAppSettingsDialog = createAction(TOGGLE_APP_SETTINGS_DIALOG)
