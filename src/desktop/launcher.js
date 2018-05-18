const { app, BrowserWindow } = require('electron')
const logger = require('electron-timber')
const windowStateKeeper = require('electron-window-state')
const fs = require('fs')
const path = require('path')
const url = require('url')
const yargs = require('yargs/yargs')

// Keep a global reference to the main window to prevent the garbage
// collector from destroying it
let mainWindow

// Keep another reference to an object that stores the position and size
// of the main window
let mainWindowState

// Set our own Google API key that we will use for geolocation requests
process.env.GOOGLE_API_KEY = 'AIzaSyC-Emzc-ogrp8ZW05zF6Sx0x5VDDyQfpLw'

// Decide whether we will connect to the Webpack dev server in development
// mode or not
const willUseWebpack = (process.env.NODE_ENV !== 'production')

/**
 * Creates the main window of the application.
 *
 * @param  {Object}   opts  options for opening the window
 * @param  {boolean}  opts.debug  whether to start with the developer tools open
 */
function createMainWindow (opts) {
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
    webPreferences: {
      preload: path.join(__dirname, willUseWebpack ? 'preload.js' : 'preload.bundle.js')
      // contextIsolation: true       // TODO(ntamas): uncomment this
      // nodeIntegration: false       // TODO(ntamas): uncomment this
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
}

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
 * Main entry point of the application.
 *
 * @param  {Object}  argv  the parsed command line arguments
 */
function run (argv) {
  const windowOptions = {
    debug: argv.debug
  }

  // Create the main window when the application is ready
  app.on('ready', () => {
    createMainWindow(windowOptions)
  })

  // Quit when all windows are closed -- unless we are on a Mac
  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit()
    }
  })

  // Re-create the main window on a Mac when the user clicks on the Dock
  // icon, unless we already have a main window
  app.on('activate', () => {
    if (mainWindow === undefined) {
      createMainWindow(windowOptions)
    }
  })

  // Handle certificate errors
  app.on('certificate-error', (event, webContents, url, error, cert, allowCallback) => {
    if (willUseWebpack && url.match(/^(https|wss):\/\/localhost:.*\//)) {
      event.preventDefault()
      allowCallback(true)
    } else {
      logger.warn('Prevented connection to URL due to certificate error:', url)
    }
  })
}

module.exports = argv => {
  // Don't use require('yargs') below because Webpack; see:
  // https://github.com/yargs/yargs/issues/781
  const parser = yargs()
    .usage('$0 [options]', 'Launches Flockwave in a desktop window')

    .boolean('d')
    .alias('d', 'debug')
    .describe('d', 'Start in debug mode with the developer tools open')

    .help()

  run(parser.parse(argv || process.argv))
}
