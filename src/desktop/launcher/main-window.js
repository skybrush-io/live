const { BrowserWindow } = require('electron');
const fs = require('fs');
const url = require('url');
const path = require('path');
const windowStateKeeper = require('electron-window-state');

const { willUseWebpackDevServer } = require('./utils');

// Keep a global reference to the main window to prevent the garbage
// collector from destroying it
let mainWindow;

// Keep another reference to an object that stores the position and size
// of the main window
let mainWindowState;

function getURLToLoad() {
  if (!willUseWebpackDevServer) {
    let index = path.join(__dirname, 'index.html');
    if (!fs.existsSync(index)) {
      index = path.join(__dirname, '..', 'index.html');
    }

    return url.format({
      pathname: index,
      protocol: 'file:',
      slashes: true
    });
  }

  /* Load from webpack-dev-server */
  return 'https://localhost:8080/index.html';
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
const createMainWindow = (app, options) => {
  if (mainWindow !== undefined) {
    return mainWindow;
  }

  if (!mainWindowState) {
    mainWindowState = windowStateKeeper({
      defaultWidth: 1280,
      defaultHeight: 800,
      fullScreen: false
    });
  }

  const preloadScriptPath = path.join(
    __dirname,
    willUseWebpackDevServer ? '../preload/index.js' : 'preload.bundle.js'
  );

  const { x, y, width, height } = mainWindowState;
  mainWindow = new BrowserWindow({
    title: app.name,
    show: false,
    backgroundColor: '#fff', // for nicer font antialiasing
    x,
    y,
    width,
    height,
    webPreferences: {
      // It would be nice to have contextIsolation: true, but I don't see
      // how we could inject window.bridge into the main window if the
      // two contexts are isolated
      contextIsolation: false,
      nodeIntegration: false,
      preload: preloadScriptPath
    }
  });
  mainWindowState.manage(mainWindow);

  mainWindow.on('closed', () => {
    mainWindowState.unmanage(mainWindow);
    mainWindow = undefined;
  });

  mainWindow.on('ready-to-show', () => {
    mainWindow.show();
    mainWindow.focus();

    if (options.debug) {
      mainWindow.webContents.openDevTools({
        mode: 'undocked'
      });
    }
  });

  mainWindow.loadURL(getURLToLoad());

  return mainWindow;
};

/**
 * Returns a reference to the main window of the application.
 *
 * @return {Object} the main window of the application, or undefined if there
 *         is no main window at the moment
 */
const getMainWindow = () => mainWindow;

module.exports = {
  createMainWindow,
  getMainWindow
};
