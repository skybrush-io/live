const ipc = require('electron-better-ipc')

module.exports = store => {
  ipc.answerMain('dispatch', arg => {
    console.log(window.bridge.dispatch)
    window.bridge.dispatch(arg)
  })
}
