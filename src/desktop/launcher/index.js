const { app, Menu, protocol } = require('electron');
const unhandled = require('electron-unhandled');
const logger = require('electron-timber');
const yargs = require('yargs/yargs');

const setupIpc = require('./ipc');
const { createMainWindow } = require('./main-window');
const createAppMenu = require('./app-menu');
const { isProduction, willUseWebpack } = require('./utils');

// Set our own Google API key that we will use for geolocation requests
process.env.GOOGLE_API_KEY = 'AIzaSyC-Emzc-ogrp8ZW05zF6Sx0x5VDDyQfpLw';

// Trace promisification API progress if we are not in production mode
if (!isProduction) {
  process.enablePromiseAPIs = true;
}

/**
 * Main entry point of the application.
 *
 * @param  {Object}  argv  the parsed command line arguments
 */
function run(argv) {
  const windowOptions = {
    debug: argv.debug
  };

  // Register unhandled error handler
  unhandled({ logger: e => logger.error(e.stack) });

  // Register the WebSocket protocol as secure even if it is not really a
  // secure one. This is needed to allow us to connect to plain WebSocket
  // servers (like our demo server) even if we are using https://, which is
  // the case for our local development setup. Note that this is irrelevant
  // if we are not using Webpack.
  if (willUseWebpack) {
    protocol.registerSchemesAsPrivileged([
      { scheme: 'ws', privileges: { standard: true, secure: true } }
    ]);
  }

  // Create the main window when the application is ready
  app.on('ready', () => {
    Menu.setApplicationMenu(createAppMenu(app));
    createMainWindow(app, windowOptions);
  });

  // Quit when all windows are closed -- unless we are on a Mac
  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  // Re-create the main window on a Mac when the user clicks on the Dock
  // icon, unless we already have a main window
  app.on('activate', () => {
    createMainWindow(app, windowOptions);
  });

  // Handle certificate errors
  app.on(
    'certificate-error',
    (event, webContents, url, error, cert, allowCallback) => {
      if (willUseWebpack && url.match(/^(https|wss):\/\/localhost:.*\//)) {
        event.preventDefault();
        allowCallback(true);
      } else {
        logger.warn(
          'Prevented connection to URL due to certificate error:',
          url
        );
      }
    }
  );

  // Set up IPC handlers
  setupIpc();
}

module.exports = argv => {
  // Don't use require('yargs') below because Webpack; see:
  // https://github.com/yargs/yargs/issues/781
  const parser = yargs()
    .usage('$0 [options]', 'Launches Skybrush in a desktop window')

    .boolean('d')
    .alias('d', 'debug')
    .describe('d', 'Start in debug mode with the developer tools open')

    .help();

  run(parser.parse(argv || process.argv));
};
