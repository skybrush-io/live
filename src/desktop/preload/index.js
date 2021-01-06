/**
 * @file Preload script that gets executed in the renderer processes _before_
 * it is dropping its privileges to access Node.js methods.
 *
 * This is the place where we can construct a limited "API" object that the
 * renderer processes can use to talk to Node.js.
 */

const dns = require('dns');
const fs = require('fs');
const { ipcRenderer: ipc } = require('electron-better-ipc');
const unhandled = require('electron-unhandled');
const SSDPClient = require('node-ssdp-lite');
const watch = require('node-watch');
const path = require('path');
const pify = require('pify');
const createStorageEngine = require('redux-persist-electron-storage');
const streamToBlob = require('stream-to-blob');

const localServer = require('./local-server');
const setupIpc = require('./ipc');

unhandled({
  logger: (error) => console.error(error.stack),
  // tippy.js seems to have a bug with the tooltips we use in the 3D view, and
  // this sometimes throws unhandled exceptions. We don't want these to
  // interfere with the user so we disable the unhandled exception dialog until
  // the bug is fixed in tippy.js
  showDialog: false,
});

/**
 * Creates a new SSDP client object and registers the given function to be
 * called when an SSDP response is received.
 *
 * @param  {Function} callback  the callback function to call. It will be
 *         called with two arguments: the SSDP response headers and the
 *         request info object
 * @return {Object} a plain object with a `search()` method that can be called to
 *         initiate a search
 */
function createSSDPClient(callback) {
  const client = new SSDPClient();
  if (callback) {
    client.on('response', callback);
  }

  return {
    search: client.search.bind(client),
  };
}

/**
 * Creates a Redux state store object that stores the Redux state in an
 * Electron store.
 *
 * @return {Object}  a Redux storage engine that can be used by redux-storage
 */
function createStateStore() {
  return createStorageEngine({
    store: {
      name: 'state',
    },
  });
}

const readDir = pify(fs.readdir);
const reverseDNSLookup = pify(dns.reverse);

// Inject isElectron into 'window' so we can easily detect that we are
// running inside Electron
window.isElectron = true;

// Inject the bridge functions between the main and the renderer processes.
// These are the only functions that the renderer processes may call to access
// any functionality that requires Node.js -- they are not allowed to use
// Node.js modules themselves
window.bridge = {
  createSSDPClient,
  createStateStore,
  dispatch: () => {
    throw new Error('no store dispatcher was set up yet');
  },
  getApplicationFolder: () => ipc.callMain('getApplicationFolder'),

  /**
   * Reads the file with the given name from the disk and returns a Blob object
   * that is compatible with Electron's File objects so they can be used
   * interchangeably.
   *
   * @param  {string}  filename  the name of the file to load
   * @param  {string}  mimeType  the MIME type of the file, if known
   * @return a promise that resolves with the blob representing the file
   */
  getFileAsBlob: async (filename, mimeType) => {
    if (!path.isAbsolute(filename)) {
      throw new Error('getFileAsBlob() needs an absolute path');
    }

    const blob = await streamToBlob(fs.createReadStream(filename), mimeType);

    // We need an absolute path because we are trying to mimic Electron's
    // File object here, which contains the _full_, absolute path in the
    // path attribute
    blob.path = filename;
    blob.name = path.basename(filename);

    return blob;
  },

  localServer,
  readDir,
  reverseDNSLookup,

  /**
   * Starts watching the file with the given name for changes and calls a
   * handler whenever the file changed. The first argument of the handler is
   * <code>update</code> or <code>delete</code>, depending on what happened
   * with the file. The second argument is the name of the file itself.
   *
   * @param  {string}   filename  name of the file to watch
   * @param  {function} handler   the handler function
   * @return {function} a function that must be called with no arguments when
   *         the file does not have to be watched any more
   */
  watchFile: (filename, handler) => {
    const watcher = watch(filename, handler);
    return watcher.close;
  },
};

// Set up IPC channels that we are going to listen to
setupIpc();
