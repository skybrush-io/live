const { app, BrowserWindow } = require('electron')
const path = require('path')
const url = require('url')

// Keep a global reference to the main window to prevent the garbage
// collector from destroying it
let mainWindow

/**
 * Creates the main window of the application.
 *
 * @param  {Object}   opts  options for opening the window
 * @param  {boolean}  opts.debug  whether to start with the developer tools open
 */
function createMainWindow (opts) {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 830,
    show: false
  })

  mainWindow.on('closed', () => {
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

  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'index.html'),
    protocol: 'file:',
    slashes: true
  }))
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
}

const parser = (
  require('yargs')
    .usage('$0 [options]', 'Launches Flockwave in a desktop window')

    .boolean('d')
    .alias('d', 'debug')
    .describe('d', 'Start in debug mode with the developer tools open')

    .help()
)

run(parser.argv)
