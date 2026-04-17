import ScreenFull from 'screenfull';
import { handleError } from '~/error-handling';
import { isRunningOnMac, isRunningOnWindows } from './platform';

/**
 * Stores the hotkey that should be used to enter full-screen mode on the current platform.
 */
export const FULL_SCREEN_HOTKEY = isRunningOnMac
  ? 'command+ctrl+f'
  : isRunningOnWindows
    ? 'f11'
    : 'f11';

/**
 * Function that handles toggling the full-screen state of the application while
 * handling any errors gracefully.
 */
export const toggleFullScreen = () => {
  ScreenFull.toggle().catch(handleError);
};
