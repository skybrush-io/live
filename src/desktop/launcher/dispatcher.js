const { ipcMain: ipc } = require('electron-better-ipc');

const { getMainWindow } = require('./main-window');

const dispatch = async (action) => {
  const mainWindow = getMainWindow();

  if (mainWindow === undefined) {
    console.warn('No main window; action ignored');
    return;
  }

  await ipc.callRenderer(mainWindow, 'dispatch', action);
};

module.exports = dispatch;
