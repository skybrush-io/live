import { isRunningOnMac } from './platform';

export type EventWithModifierKeys = Event & {
  readonly altKey?: boolean;
  readonly ctrlKey?: boolean;
  readonly metaKey?: boolean;
  readonly shiftKey?: boolean;
};

export const eventHasAltKey = (event: EventWithModifierKeys): boolean =>
  Boolean(event.altKey);

export const eventHasCtrlKey = (event: EventWithModifierKeys): boolean =>
  Boolean(event.ctrlKey);

export const eventHasMetaKey = (event: EventWithModifierKeys): boolean =>
  Boolean(event.metaKey);

export const eventHasShiftKey = (event: EventWithModifierKeys): boolean =>
  Boolean(event.shiftKey);

/**
 * Returns whether the given browser event has the platform-specific
 * hotkey modifier pressed.
 *
 * @param event - The event to test
 * @returns True if the platform-specific hotkey modifier
 *          was pressed during the event, false otherwise
 */
export const eventHasPlatformModifierKey = isRunningOnMac
  ? eventHasMetaKey
  : eventHasCtrlKey;
