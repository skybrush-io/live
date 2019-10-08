import * as OLCondition from 'ol/events/condition';

import { eventHasPlatformModifierKey } from '../../utils/platform';

const Condition = Object.assign({}, OLCondition);

/**
 * Helper condition that checks if platform modifier
 * (Meta on OSX, Control on other platforms) was pressed during the event.
 *
 * @param {event}  mapBrowserEvent  the actual event
 * @return {boolean}  whether the condition was met
 */
Condition.platformModifierKey = mapBrowserEvent =>
  eventHasPlatformModifierKey(mapBrowserEvent.originalEvent);

/**
 * Helper condition that accepts either only platformModifier
 * or only Shift being held down during an openlayers interaction.
 *
 * @param {event}  mapBrowserEvent  the actual event
 * @return {boolean}  whether the condition was met
 */
Condition.platformModifierKeyOrShiftKeyOnly = mapBrowserEvent =>
  OLCondition.platformModifierKeyOnly(mapBrowserEvent) ||
  OLCondition.shiftKeyOnly(mapBrowserEvent);

/**
 * Helper condition that accepts Alt and Shift being held down
 * during an openlayers interaction with the middle mouse button.
 *
 * @param {event}  mapBrowserEvent  the actual event
 * @return {boolean}  whether the condition was met
 */
Condition.altShiftKeyAndMiddleMouseButton = mapBrowserEvent =>
  mapBrowserEvent.originalEvent.button === 1 &&
  mapBrowserEvent.originalEvent.shiftKey &&
  mapBrowserEvent.originalEvent.altKey;

/**
 * Helper condition that checks for a context menu event.
 *
 * @param {event}  mapBrowserEvent  the actual event
 * @return {boolean}  whether the condition was met
 */
Condition.contextMenu = mapBrowserEvent =>
  mapBrowserEvent.originalEvent.type === 'contextmenu';

/**
 * Helper condition that checks for a pointerdown event fired by a right click.
 *
 * @param {event}  mapBrowserEvent  the actual event
 * @return {boolean}  whether the condition was met
 */
Condition.rightClick = mapBrowserEvent =>
  mapBrowserEvent.pointerEvent &&
  mapBrowserEvent.pointerEvent.type === 'pointerup' &&
  mapBrowserEvent.pointerEvent.button === 2;

export default Condition;
