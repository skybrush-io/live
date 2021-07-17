const { ipcMain: ipc } = require('electron-better-ipc');

const getApplicationFolder = require('./app-folder');
const { writeBufferToFile } = require('./filesystem');
const localServer = require('./local-server');
const powerSaving = require('./power-saving');

module.exports = () => {
  ipc.answerRenderer('getApplicationFolder', getApplicationFolder);
  ipc.answerRenderer('localServer.launch', localServer.launch);
  ipc.answerRenderer('localServer.search', localServer.search);
  ipc.answerRenderer('localServer.terminate', localServer.terminate);
  ipc.answerRenderer('writeBufferToFile', writeBufferToFile);
  ipc.answerRenderer(
    'powerSaving.setSleepModePrevented',
    powerSaving.setSleepModePrevented
  );
};
