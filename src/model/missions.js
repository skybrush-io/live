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
};

/**
 * Returns whether the given mission item is valid.
 */
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
      // eslint-disable-next-line no-case-declarations
      const { lon, lat } = parameters;
      if (
        typeof lon !== 'number' ||
        typeof lat !== 'number' ||
        !Number.isFinite(lon) ||
        !Number.isFinite(lat)
      ) {
        return false;
      }

      break;

    case MissionItemType.LAND:
      break;

    case MissionItemType.TAKEOFF:
      break;

    case MissionItemType.RETURN_TO_HOME:
      break;

    default:
      break;
  }

  return true;
}

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
