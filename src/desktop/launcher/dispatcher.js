const ipc = require('electron-better-ipc')
const logger = require('electron-timber')

const { getMainWindow } = require('./main-window')

const dispatch = async action => {
  const mainWindow = getMainWindow()

  if (mainWindow === undefined) {
    logger.warn('No main window; action ignored')
    return
  }

  try {
    await ipc.callRenderer(mainWindow, 'dispatch', action)
  } catch (err) {
    logger.error(err)
  }
}

module.exports = dispatch
