import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import process from 'node:process';

import { app, protocol } from 'electron';
import ElectronStore from 'electron-store';

import { setupApp, setupCli } from '@skybrush/electron-app-framework';

import setupIpc from './ipc.mjs';
import createAppMenu from './app-menu.mjs';
import * as localServer from './local-server.mjs';

const getMainWindowUrls = () => {
  // __IS_PRODUCTION__ is replaced by webpack DefinePlugin at build time
  if (!__IS_PRODUCTION__) {
    const authority = process.env['WEBPACK_DEV_SERVER_URL'] ?? 'localhost:8080';
    return {
      url: `https://${authority}/index.html`,
      preload: path.join(app.getAppPath(), 'preload/index.mjs'),
    };
  }

  return {
    url: pathToFileURL(path.join(app.getAppPath(), 'index.html')).href,
    preload: path.join(app.getAppPath(), 'preload.bundle.mjs'),
  };
};

const usingWebpackDevServer = !__IS_PRODUCTION__;

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
      rootDir: getMainWindowUrls,
      showMenuBar: false,
      webPreferences: {
        backgroundThrottling: false,
        sandbox: false, // because we need Node.js modules from the preloader
      },
    },
    subWindowMenuBar: false,
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
    // Set the user agent of the application so we don't get blocked on
    // the OpenStreetMap tile server
    const productName = app.getName();
    const version = app.getVersion();
    if (productName && version) {
      webContents.setUserAgent(`${productName} ${version}`);
    }

    // Disable background throttling of the app as we need accurate timers
    // to keep the status of the drones up-to-date
    webContents.setBackgroundThrottling(false);
  });

  // Stop any locally spawned server processes when the app quits
  app.on('will-quit', async () => {
    // Note that this is _not_ called on Windows when the user shuts down,
    // reboots or logs out, but it's okay because in that case the server process
    // will be stopped by Windows itself
    await localServer.terminate();
  });

  // Set up IPC handlers
  setupIpc();
}

const main = () => {
  const parser = setupCli();
  parser.allowUnknownOption(true);
  parser.parse(process.argv, {
    from: process.versions?.electron ? 'electron' : 'node',
  });
  run(parser.opts());
};

export default main;
