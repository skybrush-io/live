/**
 * @file Action factories related to updating the settings of the app.
 */

import { actions } from '../reducers/dialogs/app-settings.js';

export const {
  closeAppSettingsDialog,
  setAppSettingsDialogTab,
  showAppSettingsDialog,
  toggleAppSettingsDialog,
} = actions;
