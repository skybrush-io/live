import { type Altitude, AltitudeReference } from '~/utils/geography';

export { type Altitude, AltitudeReference } from '~/utils/geography';

/**
 * Enum representing the types of missions that we support.
 */
export enum MissionType {
  // Drone light show
  SHOW = 'show',

  // Waypoint mission
  WAYPOINT = 'waypoint',

  // Unknown mission type
  UNKNOWN = '',
}

/**
 * Type specification for items in a waypoint mission.
 */
export type MissionItem = {
  id: string;
  type: MissionItemType;
  parameters: Record<string, any>;
};

/**
 * Enum representing known mission items in a waypoint mission.
 */
export enum MissionItemType {
  UNKNOWN = '',
  TAKEOFF = 'takeoff',
  LAND = 'land',
  RETURN_TO_HOME = 'returnToHome',
  GO_TO = 'goTo',
  CHANGE_ALTITUDE = 'changeAltitude',
  SET_PAYLOAD = 'setPayload',
}

/**
 * Enum representing valid payload action strings.
 */
export enum PayloadAction {
  ON = 'on',
  OFF = 'off',
}

/**
 * Returns whether the given parameter representing an altitude in a generic
 * mission item is valid.
 */
function isAltitudeParameterValid(alt: any): alt is Altitude {
  if (typeof alt !== 'object') {
    return false;
  }

  const { value, reference } = alt;
  if (
    typeof value !== 'number' ||
    !Number.isFinite(value) ||
    typeof reference !== 'string' ||
    !Object.values(AltitudeReference).includes(reference as AltitudeReference)
  ) {
    return false;
  }

  return true;
}

/**
 * Returns whether the given mission item is valid.
 */
// eslint-disable-next-line complexity
export function isMissionItemValid(item: any): item is MissionItem {
  if (typeof item !== 'object') {
    return false;
  }

  const { type, parameters } = item;
  if (typeof type !== 'string' || !type) {
    return false;
  }

  if (typeof parameters !== 'object') {
    return false;
  }

  /* eslint-disable no-lone-blocks */

  switch (type) {
    case MissionItemType.UNKNOWN:
      return false;

    case MissionItemType.GO_TO:
      /* "Go to" items need a latitude and a longitude at least */
      {
        const { lon, lat, alt } = parameters;
        if (
          typeof lon !== 'number' ||
          typeof lat !== 'number' ||
          !Number.isFinite(lon) ||
          !Number.isFinite(lat) ||
          (alt !== undefined && !isAltitudeParameterValid(alt))
        ) {
          return false;
        }
      }

      break;

    case MissionItemType.CHANGE_ALTITUDE:
      /* "Change altitude" items need an altitude */
      {
        const { alt } = parameters;
        if (!isAltitudeParameterValid(alt)) {
          return false;
        }
      }

      break;

    case MissionItemType.LAND:
      break;

    case MissionItemType.TAKEOFF:
      break;

    case MissionItemType.RETURN_TO_HOME:
      break;

    case MissionItemType.SET_PAYLOAD:
      /* "Set payload" items need a name and a valid action */
      {
        const { name, action } = parameters;
        if (
          typeof name !== 'string' ||
          typeof action !== 'string' ||
          !Object.values(PayloadAction).includes(action as PayloadAction)
        ) {
          return false;
        }
      }

      break;

    default:
      break;
  }

  /* eslint-enable no-lone-blocks */

  return true;
}

/**
 * Extracts a GPS coordinate from a mission item, corresponding to the point
 * where the item should appear on the map, or undefined if the mission item
 * should not be represented on the map. GPS coordinates are represented with
 * keys `lon` and `lat`.
 */
export function getCoordinateFromMissionItem(
  item: MissionItem
): { lon: number; lat: number } | undefined {
  if (!isMissionItemValid(item)) {
    return undefined;
  }

  if (item.type === MissionItemType.GO_TO) {
    const { lon, lat } = item.parameters;
    return { lon: lon as number, lat: lat as number };
  }

  return undefined;
}

/**
 * Extracts an altitude object from a mission item, including the value and the
 * reference. The returned object will have two keys: `value` for the value of
 * the altitude and `reference` for the reference altitude (`home` for altitude
 * above home, `msl` for altitude above mean sea level and maybe `terrain`
 * for altitude above terrain in the future).
 */
export function getAltitudeFromMissionItem(
  item: MissionItem
): Altitude | undefined {
  if (!isMissionItemValid(item)) {
    return undefined;
  }

  if (
    item.type === MissionItemType.GO_TO ||
    item.type === MissionItemType.TAKEOFF ||
    item.type === MissionItemType.CHANGE_ALTITUDE
  ) {
    return item.parameters['alt'] as Altitude;
  }

  return undefined;
}
