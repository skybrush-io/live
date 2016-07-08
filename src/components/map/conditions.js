import ol from 'openlayers'
import { isRunningOnMac } from '../../utils/platform'

let Condition = {}

/**
 * Helper condition that checks if platform modifier
 * (Meta on OSX, Control on other platforms) was pressed during the event.
 *
 * @param {event}  mapBrowserEvent  the actual event
 * @return {boolean}  whether the condition was met
 */
Condition.platformModifierKey = mapBrowserEvent => (
  isRunningOnMac
  ? mapBrowserEvent.originalEvent.metaKey
  : mapBrowserEvent.originalEvent.ctrlKey
)

/**
 * Helper condition that accepts either only platformModifier
 * or only Shift being held down during an openlayers interaction.
 *
 * @param {event}  mapBrowserEvent  the actual event
 * @return {boolean}  whether the condition was met
 */
Condition.platformModifierKeyOrShiftKeyOnly = mapBrowserEvent => (
  ol.events.condition.platformModifierKeyOnly(mapBrowserEvent) ||
  ol.events.condition.shiftKeyOnly(mapBrowserEvent)
)

/**
 * Helper condition that accepts Alt and Shift being held down
 * during an openlayers interaction with the middle mouse button.
 *
 * @param {event}  mapBrowserEvent  the actual event
 * @return {boolean}  whether the condition was met
 */
Condition.altShiftKeyAndMiddleMouseButton = mapBrowserEvent => (
  mapBrowserEvent.originalEvent.button === 1 &&
  mapBrowserEvent.originalEvent.shiftKey &&
  mapBrowserEvent.originalEvent.altKey
)

export default Condition
