import { type PreparedI18nKey, tt } from '~/i18n';
import { type Coordinate2D } from '~/utils/math';

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

const geofenceActionDescriptions: Record<GeofenceAction, PreparedI18nKey> = {
  [GeofenceAction.KEEP_CURRENT]: tt('geofenceAction.keepCurrent'),
  [GeofenceAction.REPORT]: tt('geofenceAction.report'),
  [GeofenceAction.LAND]: tt('general.commands.land'),
  [GeofenceAction.RETURN]: tt('general.commands.returnToHome'),
  [GeofenceAction.SMART_LAND]: tt('geofenceAction.smartLand'),
  [GeofenceAction.SMART_RETURN]: tt('geofenceAction.smartReturn'),
  [GeofenceAction.STOP]: tt('geofenceAction.stop'),
  [GeofenceAction.SHUT_DOWN]: tt('geofenceAction.shutDown'),
};

/**
 * Returns a human-readable description of the given geofence action.
 */
export const describeGeofenceAction = (
  action: GeofenceAction
): PreparedI18nKey =>
  geofenceActionDescriptions[action] ??
  tt('geofenceAction.unknown', { action });

/**
 * Returns whether the given input represents a valid geofence action.
 */
export function isValidGeofenceAction(action: GeofenceAction): boolean {
  return VALID_GEOFENCE_ACTIONS.includes(action);
}

export type GeofencePolygon = {
  isInclusion: boolean;
  points: Coordinate2D[];
};

/**
 * Object type describing the possible geofence configuration parameters.
 */
export type GeofenceConfiguration = {
  enabled?: boolean;
  minAltitude?: number;
  maxDistance?: number;
  polygons?: GeofencePolygon[];
  rallyPoints?: Coordinate2D[];
  action?: GeofenceAction;
};

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

/**
 * Object type describing the possible safety configuration parameters.
 */
export type SafetyConfiguration = {
  lowBatteryThreshold?: BatteryThreshold;
  criticalBatteryVoltage?: number;
  returnToHomeAltitude?: number;
  returnToHomeSpeed?: number;
};
