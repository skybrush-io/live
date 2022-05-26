/**
 * @file Action factories related to the dialog that shows the server settings.
 */

import { actions } from '../reducers/dialogs/server-settings.js';

export const {
  closeServerSettingsDialog,
  disconnectFromServer,
  setServerSettingsDialogTab,
  showServerSettingsDialog,
  updateServerSettings,
} = actions;
