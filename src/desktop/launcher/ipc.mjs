import { ipcMain as ipc } from 'electron-better-ipc';

import getApplicationFolder from './app-folder.mjs';
import { readBufferFromFile, writeBufferToFile } from './filesystem.mjs';
import * as localServer from './local-server.mjs';
import * as powerSaving from './power-saving.mjs';

const setupIpc = () => {
  ipc.answerRenderer('getApplicationFolder', getApplicationFolder);
  ipc.answerRenderer('localServer.ensureRunning', localServer.ensureRunning);
  ipc.answerRenderer('localServer.search', localServer.search);
  ipc.answerRenderer('localServer.selectPath', localServer.selectPath);
  ipc.answerRenderer('localServer.terminate', localServer.terminate);
  ipc.answerRenderer('readBufferFromFile', readBufferFromFile);
  ipc.answerRenderer('writeBufferToFile', writeBufferToFile);
  ipc.answerRenderer(
    'powerSaving.setSleepModePrevented',
    powerSaving.setSleepModePrevented
  );
};

export default setupIpc;
