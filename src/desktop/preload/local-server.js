const { ipcRenderer: ipc } = require('electron-better-ipc');

const makeEventProxy = require('../event-proxy');

/**
 * Event proxy for the local server object.
 *
 * This object will receive events when something happens with the server in the
 * main process.
 */
const events = makeEventProxy('localServer');

/**
 * Asks the main process to ensure that a local Skybrush server executable is
 * running with the given arguments.
 *
 * @param {Object}   opts         options to tweak how the server is launched
 * @param {string[]} opts.args    additional arguments to pass to the server
 *        when launching
 * @param {number}   opts.port    the port to launch the server on
 * @param {number}   opts.timeout number of milliseconds to wait for the
 *        server detection to complete and the server to launch
 * @return {Promise<EventEmitter>}  a promise that resolves when the server process
 *         was launched successfully
 */
const ensureRunning = async (options) => {
  const { callbacks = {}, ...rest } = options;

  for (const [eventName, handler] of Object.entries(callbacks)) {
    events.on(eventName, handler);
  }

  const disposer = () => {
    for (const [eventName, handler] of Object.entries(callbacks)) {
      events.removeListener(eventName, handler);
    }
  };

  await ipc.callMain('localServer.ensureRunning', rest);

  return disposer;
};

/**
 * Asks the main process to search for the local Skybrush server executable in
 * the following places, in this order of precedence:
 *
 * - the application folder and typical platform-dependent related folders
 * - custom folders specified by the user
 * - the system path
 *
 * @param {string[]} paths    custom search folders to scan
 * @return {Promise<string>}  a promise that resolves to the full path of the
 *         server executable if found and `null` if it is not found
 */
const search = (paths) => ipc.callMain('localServer.search', paths);

/**
 * Asks the main process to show a dialog that allows the user to select a
 * single directory that will be scanned for the server executable.
 */
const selectPath = (defaultPath) =>
  ipc.callMain('localServer.selectPath', defaultPath);

/**
 * Asks the main process to terminate the local server instance that it is
 * currently managing.
 *
 * @return {Promise<void>}  a promise that resolves when the termination
 *         signal was sent to the server successfully
 */
const terminate = () => ipc.callMain('localServer.terminate');

module.exports = {
  ensureRunning,
  search,
  selectPath,
  terminate,
};
