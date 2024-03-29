import { powerSaveBlocker } from 'electron';

let token = null;

/**
 * Sends a request to the operating system asking to prevent the system from
 * going into sleep mode or to lock the screen.
 *
 * @return {object} a unique identifier of this request that can be used to
 *         cancel the request later on
 */
const preventSleepMode = () => powerSaveBlocker.start('prevent-display-sleep');

/**
 * Restores the original sleep mode, given the unique identifier returned from
 * `preventSleepMode()`
 *
 * @param {object} token the unique identifier originally returned from
 *        `preventSleepMode()`
 */
const restoreSleepMode = (token) => powerSaveBlocker.stop(token);

/**
 * Returns whether the sleep mode is currently prevented in the operating system.
 */
const isSleepModePrevented = () => {
  return token === null ? false : powerSaveBlocker.isStarted(token);
};

/**
 * Sets whether the sleep mode is currently prevented in the operating system.
 */
export const setSleepModePrevented = (value) => {
  if (isSleepModePrevented() === Boolean(value)) {
    return;
  }

  if (value) {
    token = preventSleepMode();
  } else {
    restoreSleepMode(token);
    token = null;
  }
};
