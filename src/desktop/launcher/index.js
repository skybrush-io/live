const { app, protocol } = require('electron');
const ElectronStore = require('electron-store');

const {
  setupApp,
  setupCli,
  usingWebpackDevServer,
} = require('@skybrush/electron-app-framework');

const setupIpc = require('./ipc');
const createAppMenu = require('./app-menu');

/**
 * Main entry point of the application.
 *
 * @param  {Object}  argv  the parsed command line arguments
 */
function run(argv) {
  // Allow the Electron state store to be created in the renderer process
  ElectronStore.initRenderer();

  setupApp({
    appMenu: createAppMenu,
    mainWindow: {
      debug: argv.debug,
      rootDir: __dirname,
    },
  });

  // Register the WebSocket protocol as secure even if it is not really a
  // secure one. This is needed to allow us to connect to plain WebSocket
  // servers (like our demo server) even if we are using https://, which is
  // the case for our local development setup. Note that this is irrelevant
  // if we are not using Webpack.
  if (usingWebpackDevServer) {
    protocol.registerSchemesAsPrivileged([
      { scheme: 'ws', privileges: { standard: true, secure: true } },
    ]);
  }

  // Prevent the creation of additional windows or web views. Also prevent
  // navigation and background throttling.
  app.on('web-contents-created', (_event, webContents) => {
    // Disable background throttling of the app as we need accurate timers
    // to keep the status of the drones up-to-date
    webContents.setBackgroundThrottling(false);
  });

  // Set up IPC handlers
  setupIpc();
}

module.exports = (argv) => {
  const parser = setupCli();
  parser.parse(argv || process.argv);
  run(parser.opts());
};
