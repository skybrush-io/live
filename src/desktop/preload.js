/**
 * @file Preload script that gets executed in the renderer processes _before_
 * it is dropping its privileges to access Node.js methods.
 *
 * This is the place where we can construct a limited "API" object that the
 * renderer processes can use to talk to Node.js.
 */

const pify = require('pify')

const dns = require('dns')
const { remote } = require('electron')
const console = require('electron-timber')
const { endsWith } = require('lodash')
const SSDPClient = require('node-ssdp-lite')
const path = require('path')
const which = pify(require('which'))
const createStorageEngine = require('redux-storage-engine-electron-store').default

/**
 * Path to the local executable of the Flockwave server on this machine.
 */
let localServerPath

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

/**
 * Returns an array containing the names of all directories to scan on
 * the system when looking for the server executable, _in addition to_ the
 * system path.
 *
 * These directories are derived from the current installed location of
 * the application, with a few platform-specific tweaks.
 *
 * @return {string[]}  the names of the directories to search for the local
 *         Flockwave server executable, besides the system path and the
 *         directories added explicitly by the user in the settings
 */
function getPathsRelatedToAppLocation () {
  const appFolder = getApplicationFolder()
  const folders = []

  if (process.platform === 'darwin') {
    if (endsWith(appFolder, '.app/Contents/MacOS')) {
      // This is an .app bundle so let's search the Resources folder within
      // the bundle as well as the folder containing the app bundle itself
      folders.push(path.resolve(path.dirname(appFolder), 'Resources'))
      folders.push(path.dirname(appFolder.substr(0, appFolder.length - 15)))
    } else {
      // Probably not an .app bundle so let's just assume that the server
      // might be in the same folder
      folders.push(appFolder)
    }
  } else {
    folders.push(appFolder)
  }

  return folders
}

const pathsRelatedToAppLocation = getPathsRelatedToAppLocation()
console.log(pathsRelatedToAppLocation)

/**
 * Launches the local Flockwave server executable with the given arguments.
 *
 * @param {string[]} args  the arguments to pass to the server when launching
 */
function launchServer (args) {
  console.log(localServerPath, args)
}

/**
 * Searches for the local Flockwave server executable in the following places,
 * in this order of precedence:
 *
 * - the application folder and typical platform-dependent related folders
 * - custom folders specified by the user
 * - the system path
 *
 * As a side effect, stores the path found with the last invocation so we
 * can launch the executable later if needed. Note that we cannot trust the
 * renderer process to provide us with the correct path if we want to protect
 * against XSS; a malicious attacker may attempt to launch an arbitrary
 * executable on our system if we allow the renderer process to provide the
 * path to us directly.
 *
 * @param {string[]} paths    custom search folders to scan
 * @return {Promise<string>}  a promise that resolves to the full path of the
 *         server executable if found and `null` if it is not found
 */
const searchForServer = paths =>
  which(
    'bash', {
      path: [
        ...pathsRelatedToAppLocation,
        ...paths,
        ...process.env.PATH.split(path.delimiter)
      ].join(path.delimiter)
    }
  ).then(result => {
    localServerPath = result
    return result
  })

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
  launchServer,
  reverseDNSLookup,
  searchForServer
}
