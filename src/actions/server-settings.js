/**
 * @file Actions related to the dialog that shows the server settings.
 */

import { createAction } from 'redux-actions';
import { SHOW_SERVER_SETTINGS_DIALOG } from './types';

export const showServerSettingsDialog = createAction(SHOW_SERVER_SETTINGS_DIALOG);
