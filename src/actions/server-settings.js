/**
 * @file Actions related to the dialog that shows the server settings.
 */

import { createAction } from 'redux-actions'
import { SHOW_SERVER_SETTINGS_DIALOG, CLOSE_SERVER_SETTINGS_DIALOG } from './types'

/**
 * Action that closes the server settings dialog and optionally updates the
 * current server settings from the payload.
 */
export const closeServerSettingsDialog = createAction(CLOSE_SERVER_SETTINGS_DIALOG)

/**
 * Action that shows the server settings dialog.
 */
export const showServerSettingsDialog = createAction(SHOW_SERVER_SETTINGS_DIALOG)
