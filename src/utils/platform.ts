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
 * Returns whether the given browser event has the platform-specific
 * hotkey modifier pressed.
 *
 * @param event - The event to test
 * @returns True if the platform-specific hotkey modifier
 *          was pressed during the event, false otherwise
 */
export const eventHasPlatformModifierKey = isRunningOnMac
  ? (event: KeyboardEvent | MouseEvent): boolean => Boolean(event.metaKey)
  : (event: KeyboardEvent | MouseEvent): boolean => Boolean(event.ctrlKey);

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
