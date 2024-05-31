/**
 * Enum describing the possible geofence actions.
 */
export enum GeofenceAction {
  KEEP_CURRENT = 'keepCurrent',
  REPORT = 'report',
  LAND = 'land',
  RETURN = 'return',
  SMART_LAND = 'smartLand',
  SMART_RETURN = 'smartReturn',
  STOP = 'stop',
  SHUT_DOWN = 'shutDown',
}

const VALID_GEOFENCE_ACTIONS = Object.values(GeofenceAction);

const geofenceActionDescriptions: Record<GeofenceAction, string> = {
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
export function describeGeofenceAction(action: GeofenceAction): string {
  return geofenceActionDescriptions[action] || `unknown action: ${action}`;
}

/**
 * Returns whether the given input represents a valid geofence action.
 */
export function isValidGeofenceAction(action: GeofenceAction): boolean {
  return VALID_GEOFENCE_ACTIONS.includes(action);
}

/**
 * Enum describing the possible battery threshold types.
 */
export enum BatteryThresholdType {
  OFF = 'off',
  VOLTAGE = 'voltage',
  PERCENTAGE = 'percentage',
}

/**
 * Union type describing the possible battery threshold values.
 */
export type BatteryThreshold =
  | { type: BatteryThresholdType.OFF }
  | { type: BatteryThresholdType.VOLTAGE; value: number }
  | { type: BatteryThresholdType.PERCENTAGE; value: number };

/**
 * Mapping between battery threshold types and their respective unit symbols.
 */
export const unitForBatteryThresholdType: Record<BatteryThresholdType, string> =
  {
    [BatteryThresholdType.OFF]: '',
    [BatteryThresholdType.VOLTAGE]: 'V',
    [BatteryThresholdType.PERCENTAGE]: '%',
  };
