import {
  type Condition,
  platformModifierKeyOnly,
  shiftKeyOnly,
} from 'ol/events/condition';

import { eventHasPlatformModifierKey } from '~/utils/platform';

export * from 'ol/events/condition';

/**
 * Helper condition that checks if platform modifier
 * (Meta on OSX, Control on other platforms) was pressed during the event.
 *
 * @param mapBrowserEvent - The actual event
 * @returns Whether the condition was met
 */
export const platformModifierKey: Condition = (mapBrowserEvent) =>
  (mapBrowserEvent.originalEvent instanceof KeyboardEvent ||
    mapBrowserEvent.originalEvent instanceof MouseEvent) &&
  eventHasPlatformModifierKey(mapBrowserEvent.originalEvent);

/**
 * Helper condition that accepts either only platformModifier
 * or only Shift being held down during an openlayers interaction.
 *
 * @param mapBrowserEvent - The actual event
 * @returns Whether the condition was met
 */
export const platformModifierKeyOrShiftKeyOnly: Condition = (mapBrowserEvent) =>
  platformModifierKeyOnly(mapBrowserEvent) || shiftKeyOnly(mapBrowserEvent);

/**
 * Helper condition that accepts Alt and Shift being held down
 * during an openlayers interaction with the middle mouse button.
 *
 * @param mapBrowserEvent - The actual event
 * @returns Whether the condition was met
 */
export const altShiftKeyAndMiddleMouseButton: Condition = (mapBrowserEvent) =>
  mapBrowserEvent.originalEvent instanceof MouseEvent &&
  mapBrowserEvent.originalEvent.button === 1 &&
  mapBrowserEvent.originalEvent.shiftKey &&
  mapBrowserEvent.originalEvent.altKey;

/**
 * Helper condition that checks for a context menu event.
 *
 * @param mapBrowserEvent - The actual event
 * @returns Whether the condition was met
 */
export const contextMenu: Condition = (mapBrowserEvent) =>
  mapBrowserEvent.originalEvent.type === 'contextmenu';

/**
 * Helper condition that checks for a pointerdown event fired by a right click.
 *
 * NOTE: Since this is currently unused and not valid in its present form, I
 *       disabled it for now instead of figuring out why `originalEvent` was
 *       changed to `pointerEvent` in `b778f2ba`. - Isti115 @ 2023. 07. 22.
 *       https://github.com/skybrush-io/live/commit/b778f2ba
 *
 * @param mapBrowserEvent - The actual event
 * @returns Whether the condition was met
 */
// export const rightClick: Condition = (mapBrowserEvent) =>
//   mapBrowserEvent.pointerEvent &&
//   mapBrowserEvent.pointerEvent.type === 'pointerup' &&
//   mapBrowserEvent.pointerEvent.button === 2;

/**
 * Helper condition that checks for a keydown event fired by the `Escape` key.
 *
 * @param mapBrowserEvent - The actual event
 * @returns Whether the condition was met
 */
export const escapeKeyDown: Condition = (mapBrowserEvent) =>
  mapBrowserEvent.type === 'keydown' &&
  mapBrowserEvent.originalEvent.code === 'Escape';
