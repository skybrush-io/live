/**
 * @file Preload script that gets executed in the renderer processes _before_
 * it is dropping its privileges to access Node.js methods.
 *
 * This is the place where we can construct a limited "API" object that the
 * renderer processes can use to talk to Node.js.
 */

const dns = require('dns')
const { remote } = require('electron')
const console = require('electron-timber')
const SSDPClient = require('node-ssdp-lite')
const path = require('path')
const pify = require('pify')
const createStorageEngine = require('redux-storage-engine-electron-store').default

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
function createSSDPClient (callback) {
  const client = new SSDPClient()
  if (callback) {
    client.on('response', callback)
  }
  return {
    search: client.search.bind(client)
  }
}

/**
 * Creates a Redux state store object that stores the Redux state in an
 * Electron store.
 *
 * @return {Object}  a Redux storage engine that can be used by redux-storage
 */
function createStateStore () {
  return createStorageEngine({
    store: {
      name: 'state'
    }
  })
}

/**
 * Returns the name of the folder that contains the main executable of the
 * application.
 *
 * @return {string} the name of the folder that contains the main executable
 *         of the application
 */
function getApplicationFolder () {
  return path.dirname(remote.app.getPath('exe'))
}

const reverseDNSLookup = pify(dns.reverse)

// inject isElectron into 'window' so we can easily detect that we are
// running inside Electron
window.isElectron = true

// inject the bridge functions between the main and the renderer processes.
// These are the only functions that the renderer processes may call to access
// any functionality that requires Node.js -- they are not allowed to use
// Node.js modules themselves
window.bridge = {
  console,
  createSSDPClient,
  createStateStore,
  getApplicationFolder,
  reverseDNSLookup
}
