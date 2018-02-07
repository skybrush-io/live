/**
 * @file Re-exporting the Node.js native `dns` module so it can be resolved as
 * an alias in the Webpack config for Electron.
 *
 * This module is not (and should not) be imported in browser builds.
 */

export const dns = require('dns')
