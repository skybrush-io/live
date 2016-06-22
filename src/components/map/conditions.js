import ol from 'openlayers'

let Condition = {}

/**
 * Helper condition that accepts either only platformModifier
 * or only Shift being held down during an openlayers interaction.
 *
 * @todo Ask Tamás which solution is better (fully custom or partially buit in).
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
Condition.AltShiftKeyAndMiddleMouseButton = mapBrowserEvent => (
  mapBrowserEvent.originalEvent.button === 1 &&
  mapBrowserEvent.originalEvent.shiftKey &&
  mapBrowserEvent.originalEvent.altKey
)

export default Condition
