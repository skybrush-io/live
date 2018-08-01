const { BrowserWindow } = require('electron')
const windowStateKeeper = require('electron-window-state')
const fs = require('fs')
const url = require('url')
const path = require('path')

const { willUseWebpack } = require('./utils')

// Keep a global reference to the main window to prevent the garbage
// collector from destroying it
let mainWindow

// Keep another reference to an object that stores the position and size
// of the main window
let mainWindowState

function getURLToLoad () {
  if (!willUseWebpack) {
    let index = path.join(__dirname, 'index.html')
    if (!fs.existsSync(index)) {
      index = path.join(__dirname, '..', 'index.html')
    }

    return url.format({
      pathname: index,
      protocol: 'file:',
      slashes: true
    })
  } else {
    /* Load from webpack-dev-server */
    return 'https://localhost:8080/index.html'
  }
}

/**
 * Creates the main window of the application.
 *
 * Prevents the creation of multiple main windows; if a main window exists
 * already, it will return the existing main window instance.
 *
 * @param  {Object}   app  the main Electron application object
 * @param  {Object}   opts  options for opening the window
 * @param  {boolean}  opts.debug  whether to start with the developer tools open
 * @return {Object} the main window of the application that was created
 */
module.exports = (app, opts) => {
  if (mainWindow !== undefined) {
    return mainWindow
  }

  if (!mainWindowState) {
    mainWindowState = windowStateKeeper({
      defaultWidth: 1280,
      defaultHeight: 800,
      fullScreen: false
    })
  }

  const { x, y, width, height } = mainWindowState

  mainWindow = new BrowserWindow({
    title: app.getName(),
    show: false,
    x,
    y,
    width,
    height,
    icon: path.join(__dirname, 'assets/icons/png/64x64.png'),
    webPreferences: {
      nodeIntegration: false,
      preload: path.join(
        __dirname,
        willUseWebpack ? '../preload/index.js' : 'preload.bundle.js'
      )
    }
  })
  mainWindowState.manage(mainWindow)

  mainWindow.on('closed', () => {
    mainWindowState.unmanage(mainWindow)
    mainWindow = undefined
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
    mainWindow.focus()

    if (opts.debug) {
      mainWindow.webContents.openDevTools({
        mode: 'undocked'
      })
    }
  })

  mainWindow.loadURL(getURLToLoad())

  return mainWindow
}
