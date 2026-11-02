/**
 * @file Utility functions related to platform detection and other
 * platform-specific stuff.
 */

/**
 * Constant that evaluates to true if we are running on a Mac, false
 * otherwise.
 */
export const isRunningOnMac = navigator.platform.includes('Mac');

/**
 * Constant that evaluates to true if we are running on Windows, false
 * otherwise.
 */
export const isRunningOnWindows =
  navigator.platform.includes('Win32') ||
  navigator.platform.includes('Windows');

/**
 * Constant that evaluates to the name of the platform-specific hotkey
 * modifier: <code>Ctrl</code> on Windows and <code>Cmd</code> on Mac.
 */
export const platformModifierKey = isRunningOnMac ? 'Cmd' : 'Ctrl';

/**
 * Constant that evaluates to true if we are running on a device that has a
 * touch enabled screen.
 */
export const isRunningOnTouch = navigator.maxTouchPoints > 0;
