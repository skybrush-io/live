/**
 * Enum describing the possible geofence actions.
 */
export const GeofenceAction = Object.freeze({
  KEEP_CURRENT: 'keepCurrent',
  REPORT: 'report',
  LAND: 'land',
  RETURN: 'return',
  SMART_LAND: 'smartLand',
  SMART_RETURN: 'smartReturn',
  STOP: 'stop',
  SHUT_DOWN: 'shutDown',
});

const VALID_GEOFENCE_ACTIONS = Object.values(GeofenceAction);

const geofenceActionDescriptions = {
  [GeofenceAction.KEEP_CURRENT]: 'Keep current action',
  [GeofenceAction.REPORT]: 'Report only',
  [GeofenceAction.LAND]: 'Land',
  [GeofenceAction.RETURN]: 'Return to home',
  [GeofenceAction.SMART_LAND]: 'Land with collision avoidance',
  [GeofenceAction.SMART_RETURN]: 'Return to home with collision avoidance',
  [GeofenceAction.STOP]: 'Stop and hover',
  [GeofenceAction.SHUT_DOWN]: 'Shut down',
};

/**
 * Returns a human-readable description of the given geofence action.
 */
export function describeGeofenceAction(action) {
  return geofenceActionDescriptions[action] || `unknown action: ${action}`;
}

/**
 * Returns whether the given object represents a valid geofence action.
 */
export function isValidGeofenceAction(action) {
  return VALID_GEOFENCE_ACTIONS.includes(action);
}
