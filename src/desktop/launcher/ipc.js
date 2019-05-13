const { ipcMain: ipc } = require('electron-better-ipc')

const getApplicationFolder = require('./app-folder')
const localServer = require('./local-server')

module.exports = () => {
  ipc.answerRenderer('getApplicationFolder', getApplicationFolder)
  ipc.answerRenderer('localServer.launch', localServer.launch)
  ipc.answerRenderer('localServer.search', localServer.search)
  ipc.answerRenderer('localServer.terminate', localServer.terminate)
}
