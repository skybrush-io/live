/**
 * @file Re-exporting the Node.js native `path` module so it can be resolved as
 * an alias in the Webpack config for Electron.
 *
 * This module is not (and should not) be imported in browser builds.
 */

const path = require('path')
export default path
