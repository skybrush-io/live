const process = require('process');

/**
 * Stores whether we are running on macOS.
 */
const isMac = process.platform === 'darwin';

/**
 * Stores whether we are running on Windows.
 */
const isWindows = process.platform === 'win32';

module.exports = {
  isWindows,
  isMac,
};
