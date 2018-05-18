/**
 * @file Preload script that gets executed in the renderer processes _before_
 * it is dropping its privileges to access Node.js methods.
 *
 * This is the place where we can construct a limited "API" object that the
 * renderer processes can use to talk to Node.js.
 */

const console = require('electron-timber')

// inject isElectron into 'window' so we can easily detect that we are
// running inside Electron
window.isElectron = true

// inject the bridge functions between the main and the renderer processes.
// These are the only functions that the renderer processes may call to access
// any functionality that requires Node.js -- they are not allowed to use
// Node.js modules themselves
window.bridge = {
  console
}
