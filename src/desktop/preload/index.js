/**
 * @file Preload script that gets executed in the renderer processes _before_
 * it is dropping its privileges to access Node.js methods.
 *
 * This is the place where we can construct a limited "API" object that the
 * renderer processes can use to talk to Node.js.
 */

const dns = require('dns').promises;
const { contextBridge } = require('electron');
const fs = require('fs');
const { ipcRenderer: ipc } = require('electron-better-ipc');
const ElectronStore = require('electron-store');
const SSDPClient = require('node-ssdp-lite');
const watch = require('node-watch');
const path = require('path');
const createStorageEngine = require('redux-persist-electron-storage');
const streamToBlob = require('stream-to-blob');

const localServer = require('./local-server');
const {
  receiveActionsFromRenderer,
  receiveSubscriptionsFromRenderer,
  setupIpc,
} = require('./ipc');
const TCPSocket = require('./tcp-socket');

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
  const electronStore = new ElectronStore({
    // I'm not sure how graceful redux-storage is when the store throws an
    // exception during startup, so let's prevent that for the time being
    clearInvalidConfig: true,
  });

  return createStorageEngine({
    electronStore,
    store: {
      name: 'state',
    },
  });
}

const createTCPSocket = ({ address, port }, options = {}, handlers = {}) => {
  const tcpSocket = new TCPSocket({ address, port }, options, handlers);
  return {
    emit: tcpSocket.emit.bind(tcpSocket),
    end: tcpSocket.end.bind(tcpSocket),
    notifyPing: tcpSocket.notifyPing.bind(tcpSocket),
  };
};

const reverseDNSLookup = async (ip) => {
  try {
    await dns.reverse(ip);
  } catch (error) {
    if (error.code === 'ENOTFOUND') {
      // This is okay
      return [];
    } else {
      throw error;
    }
  }
};

// Inject the bridge functions between the main and the renderer processes.
// These are the only functions that the renderer processes may call to access
// any functionality that requires Node.js -- they are not allowed to use
// Node.js modules themselves
contextBridge.exposeInMainWorld('bridge', {
  createSSDPClient,
  createStateStore,
  createTCPSocket,
  dispatch() {
    throw new Error('no store dispatcher was set up yet');
  },
  isElectron: true,
  getApplicationFolder: () => ipc.callMain('getApplicationFolder'),

  /**
   * Reads the file with the given name from the disk and returns a Blob object
   * that is compatible with Electron's File objects so they can be used
   * interchangeably.
   *
   * @param  {string}  filename  the name of the file to load
   * @param  {string}  mimeType  the MIME type of the file, if known
   * @param  {object}  options   options that can be used to read a slice of a
   *         file if needed
   * @return a promise that resolves with the blob representing the file
   */
  async getFileAsBlob(filename, mimeType, options = {}) {
    if (!path.isAbsolute(filename)) {
      throw new Error('getFileAsBlob() needs an absolute path');
    }

    const { start, end } = options;
    const streamOptions = {};

    if (start !== undefined) {
      streamOptions.start = start;
    }

    if (end !== undefined) {
      streamOptions.end = end;
    }

    const blob = await streamToBlob(
      fs.createReadStream(filename, streamOptions),
      mimeType
    );

    // We cannot send the blob through directly because it does not seem to
    // work in Electron with context isolation, at least not in Electron 14

    return {
      buffer: await blob.arrayBuffer(),
      props: {
        // We need an absolute path because we are trying to mimic Electron's
        // File object here, which contains the _full_, absolute path in the
        // path attribute
        path: filename,
        name: path.basename(filename),
      },
    };
  },

  localServer,
  provideActions: receiveActionsFromRenderer,
  provideSubscriptions: receiveSubscriptionsFromRenderer,
  reverseDNSLookup,

  /**
   * Reads the contents of a file picked by the user to a buffer.
   *
   * @param {object} options additional options that are passed on to Electron's
   *        <code>showOpenDialog()</code> function
   */
  readBufferFromFile: async (options) =>
    ipc.callMain('readBufferFromFile', options),

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
  watchFile(filename, handler) {
    const watcher = watch(filename, handler);
    return watcher.close;
  },

  /**
   * Writes the given array buffer to a file, prompting the user for the name
   * of the file to save it to.
   *
   * @param {object} buffer  the buffer containing the data to save to a file
   * @param {string} preferredFilename  preferred filename that will be offered
   *        to the user as a default
   * @param {object} options additional options that are passed on to Electron's
   *        <code>showSaveDialog()</code> function
   */
  writeBufferToFile: async (buffer, preferredFilename, options) =>
    ipc.callMain('writeBufferToFile', {
      buffer,
      preferredFilename,
      options,
    }),
});

// Set up IPC channels that we are going to listen to
setupIpc();
