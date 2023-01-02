import { ALTITUDE_REFERENCES, HEADING_MODES } from '~/utils/geography';

export {
  AltitudeReference,
  ALTITUDE_REFERENCES,
  HeadingMode,
  HEADING_MODES,
} from '~/utils/geography';

/**
 * Enum representing the types of missions that we support.
 */
export const MissionType = {
  // Drone light show
  SHOW: 'show',

  // Waypoint mission
  WAYPOINT: 'waypoint',

  // Unknown mission type
  UNKNOWN: '',
};

/**
 * Enum representing known mission items in a waypoint mission.
 */
export const MissionItemType = {
  UNKNOWN: '',
  TAKEOFF: 'takeoff',
  LAND: 'land',
  RETURN_TO_HOME: 'returnToHome',
  GO_TO: 'goTo',
  CHANGE_ALTITUDE: 'changeAltitude',
  CHANGE_HEADING: 'changeHeading',
  CHANGE_SPEED: 'changeSpeed',
  SET_PAYLOAD: 'setPayload',
  SET_PARAMETER: 'setParameter',
  UPDATE_GEOFENCE: 'updateGeofence',
};

/**
 * Enum representing valid payload action strings.
 */
export const PAYLOAD_ACTIONS = ['on', 'off'];

/**
 * Returns whether the given parameter representing an altitude in a generic
 * mission item is valid.
 */
function isAltitudeParameterValid(alt) {
  if (typeof alt !== 'object') {
    return false;
  }

  const { value, reference } = alt;
  if (
    typeof value !== 'number' ||
    !Number.isFinite(value) ||
    typeof reference !== 'string' ||
    !ALTITUDE_REFERENCES.includes(reference)
  ) {
    return false;
  }

  return true;
}

/**
 * Returns whether the given parameter representing a heading change in a
 * mission item is valid.
 */
function isHeadingParameterValid(heading) {
  if (typeof heading !== 'object') {
    return false;
  }

  const { value, mode } = heading;
  if (
    typeof value !== 'number' ||
    !Number.isFinite(value) ||
    typeof mode !== 'string' ||
    !HEADING_MODES.includes(mode)
  ) {
    return false;
  }

  return true;
}

/**
 * Returns whether the given mission item is valid.
 */
/* eslint-disable complexity */
export function isMissionItemValid(item) {
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

    case MissionItemType.CHANGE_HEADING:
      /* "Change heading" items need a heading */
      {
        const { heading } = parameters;
        if (!isHeadingParameterValid(heading)) {
          return false;
        }
      }

      break;

    case MissionItemType.CHANGE_SPEED:
      /* "Change speed" items need velocityXY and velocityZ */
      {
        const { velocityXY, velocityZ } = parameters;
        if (
          typeof velocityXY !== 'number' ||
          typeof velocityZ !== 'number' ||
          !Number.isFinite(velocityXY) ||
          !Number.isFinite(velocityZ)
        ) {
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
          !PAYLOAD_ACTIONS.includes(action)
        ) {
          return false;
        }
      }

      break;

    case MissionItemType.SET_PARAMETER:
      /* "Set parameter" items need a name and a value */
      {
        const { name, value } = parameters;
        if (
          typeof name !== 'string' ||
          (typeof value !== 'string' &&
            (typeof value !== 'number' || !Number.isFinite(value)))
        ) {
          return false;
        }
      }

      break;

    case MissionItemType.UPDATE_GEOFENCE:
      /* "Update geofence" items need complex validation */
      {
        const { coordinateSystem } = parameters;
        if (
          typeof coordinateSystem !== 'string' ||
          coordinateSystem !== 'geodetic'
          // TOOD: add proper validation for the geofence object
        ) {
          return false;
        }
      }

      break;

    default:
      break;
  }

  return true;
}
/* eslint-enable complexity */

/**
 * Extracts a GPS coordinate from a mission item, corresponding to the point
 * where the item should appear on the map, or undefined if the mission item
 * should not be represented on the map. GPS coordinates are represented with
 * keys `lon` and `lat`.
 */
export function getCoordinateFromMissionItem(item) {
  if (!isMissionItemValid(item)) {
    return undefined;
  }

  if (item.type === MissionItemType.GO_TO) {
    const { lon, lat } = item.parameters;
    return { lon, lat };
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
export function getAltitudeFromMissionItem(item) {
  if (!isMissionItemValid(item)) {
    return undefined;
  }

  if (
    item.type === MissionItemType.GO_TO ||
    item.type === MissionItemType.TAKEOFF ||
    item.type === MissionItemType.CHANGE_ALTITUDE
  ) {
    return item.parameters.alt;
  }

  return undefined;
}
