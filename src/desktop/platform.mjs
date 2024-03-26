import process from 'node:process';

/**
 * Stores whether we are running on macOS.
 */
export const isMac = process.platform === 'darwin';

/**
 * Stores whether we are running on Windows.
 */
export const isWindows = process.platform === 'win32';
