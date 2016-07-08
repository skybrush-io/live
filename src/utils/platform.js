/**
 * @file Utility functions related to platform detection and other
 * platform-specific stuff.
 */

/**
 * Constant that evaluates to true if we are running on a Mac, false
 * otherwise.
 */
export const isRunningOnMac = (navigator.platform.indexOf('Mac') !== -1)

/**
 * Constant that evaluates to the name of the platform-specific hotkey
 * modifier: <code>Ctrl</code> on Windows and <code>Cmd</code> on Mac.
 */
export const platformModifierKey = isRunningOnMac ? 'Cmd' : 'Ctrl'
