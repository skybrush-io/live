import { ipcMain as ipc } from 'electron-better-ipc';

import { getMainWindow } from './main-window.mjs';

export const showAppSettingsDialog = async () => {
  const mainWindow = getMainWindow();

  if (mainWindow === undefined) {
    console.warn('No main window; action ignored');
    return;
  }

  await ipc.callRenderer(mainWindow, 'showAppSettingsDialog');
};
