const { ipcRenderer: ipc } = require('electron-better-ipc')

module.exports = store => {
  ipc.answerMain('dispatch', arg => {
    window.bridge.dispatch(arg)
  })
}
