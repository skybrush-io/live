const { ipcMain: ipc } = require('electron-better-ipc');

const { getMainWindow } = require('./main-window');

const showAppSettingsDialog = async () => {
  const mainWindow = getMainWindow();

  if (mainWindow === undefined) {
    console.warn('No main window; action ignored');
    return;
  }

  await ipc.callRenderer(mainWindow, 'showAppSettingsDialog');
};

module.exports = {
  showAppSettingsDialog,
};
