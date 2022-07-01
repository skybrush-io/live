/**
 * Selector that returns whether sleep mode should be prevented by the OS
 * if possible (and if we are not running in a browser of course).
 */

export { isConnected as shouldPreventSleepMode } from '~/features/servers/selectors';
