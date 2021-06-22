const { spawn } = require('child_process');
const path = require('path');
const pDefer = require('p-defer');
const pTimeout = require('p-timeout');
const which = require('which');

const makeEventProxy = require('../event-proxy');
const getApplicationFolder = require('./app-folder');

/**
 * Event proxy for the local server object.
 *
 * We will use this object to emit events when something happens with the
 * server in the main process. The events will be broadcast to all renderer
 * processes having the same event proxy.
 */
const events = makeEventProxy('localServer');

/**
 * The local executable of the Skybrush server on this machine.
 */
let localServerPath;

/**
 * Deferred that will resolve to the local executable of the Skybrush server
 * on this machine.
 */
let localServerPathDeferred = pDefer();

/**
 * The process representing the laucnhed Skybrush server instance on this
 * machine.
 */
let localServerProcess;

const endsWith = (string, target) =>
  string.slice(string.length - target.length) === target;

/**
 * Returns an array containing the names of all directories to scan on
 * the system when looking for the server executable, _in addition to_ the
 * system path.
 *
 * These directories are derived from the current installed location of
 * the application, with a few platform-specific tweaks.
 *
 * @return {string[]}  the names of the directories to search for the local
 *         Skybrush server executable, besides the system path and the
 *         directories added explicitly by the user in the settings
 */
function getPathsRelatedToAppLocation() {
  const appFolder = getApplicationFolder();
  const folders = [];

  if (process.platform === 'darwin') {
    if (endsWith(appFolder, '.app/Contents/MacOS')) {
      // This is an .app bundle so let's search the Resources folder within
      // the bundle as well as the folder containing the app bundle itself
      folders.push(
        path.resolve(path.dirname(appFolder), 'Resources'),
        path.dirname(appFolder.slice(0, -15))
      );
    } else {
      // Probably not an .app bundle so let's just assume that the server
      // might be in the same folder
      folders.push(appFolder);
    }
  } else {
    folders.push(appFolder);
  }

  return folders;
}

const pathsRelatedToAppLocation = Object.freeze(getPathsRelatedToAppLocation());

/**
 * Launches the local Skybrush server executable with the given arguments.
 *
 * @param {Object}   opts         options to tweak how the server is launched
 * @param {string[]} opts.args    additional arguments to pass to the server
 *        when launching
 * @param {number}   opts.port    the port to launch the server on
 * @param {number}   opts.timeout number of milliseconds to wait for the
 *        server detection to complete and the server to launch
 */
const launch = async (options) => {
  if (localServerProcess) {
    // Terminate the previous instance
    await terminate();
  }

  const { args, port, timeout } = {
    port: 5000,
    args: '',
    timeout: 5000,
    ...options,
  };

  if (localServerPathDeferred) {
    localServerPathDeferred = pDefer();
    await pTimeout(localServerPathDeferred.promise, timeout);
  }

  if (!localServerPath) {
    throw new Error('local Skybrush server not found');
  }

  const realArgs = ['-h', '127.0.0.1', '-p', port, ...args];

  localServerProcess = spawn(localServerPath, realArgs, {
    cwd: path.dirname(localServerPath),
    stdio: 'ignore',
  });

  localServerProcess.on('error', (reason) => {
    events.emit('emit', 'error', reason);
    localServerProcess = undefined;
  });
  localServerProcess.on('exit', (code, signal) => {
    events.emit('emit', 'exit', code, signal);
    localServerProcess = undefined;
  });
};

/**
 * Searches for the local Skybrush server executable in the following places,
 * in this order of precedence:
 *
 * - the application folder and typical platform-dependent related folders
 * - custom folders specified by the user
 * - the system path
 *
 * As a side effect, stores the path found with the last invocation so we
 * can launch the executable later if needed.
 *
 * @param {string[]} paths    custom search folders to scan
 * @return {Promise<string>}  a promise that resolves to the full path of the
 *         server executable if found and `null` if it is not found
 */
const search = async (paths) => {
  // Do _not_ use the async version of which here. It does not have a nothrow
  // option, and when it throws an exception, it will be caught by
  // electron-unhandled, which will throw a dialog box in the user's face in
  // production mode even though we nicely handle the exception later.

  const result = which.sync('flockwaved', {
    nothrow: true,
    path: [
      ...paths,
      ...pathsRelatedToAppLocation,
      ...process.env.PATH.split(path.delimiter),
    ].join(path.delimiter),
  });

  localServerPath = result;
  if (localServerPathDeferred) {
    localServerPathDeferred.resolve(result);
    localServerPathDeferred = undefined;
  }

  return result;
};

/**
 * Terminate the local server instance that the main process is currently
 * managing.
 */
const terminate = () => {
  if (localServerProcess) {
    localServerProcess.removeAllListeners();
    localServerProcess.kill();
    localServerProcess = undefined;
  }
};

module.exports = {
  events,
  launch,
  search,
  terminate,
};
