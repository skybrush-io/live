import { isConnected } from '~/features/servers/selectors';

/**
 * Selector that returns whether sleep mode should be prevented by the OS
 * if possible (and if we are not running in a browser of course).
 */
export const shouldPreventSleepMode = isConnected;
