import * as React from 'react';

import ChangeAltitudeIcon from '@material-ui/icons/Height';
import ChangeHeadingIcon from '@material-ui/icons/RotateLeft';
import ChangeSpeedIcon from '@material-ui/icons/Speed';
import MarkerIcon from '@material-ui/icons/Flag';
import SetPayloadIcon from '@material-ui/icons/Camera';
import SetParameterIcon from '@material-ui/icons/Settings';
import TakeoffIcon from '@material-ui/icons/FlightTakeoff';
import UpdateGeofenceIcon from '~/icons/PlacesFence';
import UpdateSafetyIcon from '@material-ui/icons/Security';
import LandIcon from '@material-ui/icons/FlightLand';
import HomeIcon from '@material-ui/icons/Home';

import {
  type Altitude,
  AltitudeReference,
  type Heading,
  HeadingMode,
} from '~/utils/geography';

export {
  type Altitude,
  AltitudeReference,
  type Heading,
  HeadingMode,
} from '~/utils/geography';

/**
 * Enum representing valid marker type strings.
 */
export enum MarkerType {
  START = 'start',
  END = 'end',
}

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
 * Enum representing known mission items in a waypoint mission.
 */
export enum MissionItemType {
  UNKNOWN = '',
  TAKEOFF = 'takeoff',
  LAND = 'land',
  RETURN_TO_HOME = 'returnToHome',
  GO_TO = 'goTo',
  CHANGE_ALTITUDE = 'changeAltitude',
  CHANGE_HEADING = 'changeHeading',
  CHANGE_SPEED = 'changeSpeed',
  MARKER = 'marker',
  SET_PAYLOAD = 'setPayload',
  SET_PARAMETER = 'setParameter',
  UPDATE_GEOFENCE = 'updateGeofence',
  UPDATE_SAFETY = 'updateSafety',
}

/**
 * Enum representing valid payload action strings.
 */
export enum PayloadAction {
  ON = 'on',
  OFF = 'off',
}

/**
 * Type specification for items in a waypoint mission.
 */
/* TODO: this should be changed to a union of multiple types, each with a fixed
 * type literal. TypeScript could then infer the correct type after a switch on
 * the type */
export type MissionItem = {
  id: string;
  type: MissionItemType;
  parameters: Record<string, any>;
};

const altitudeSchema = {
  title: 'Altitude',
  type: 'object',
  properties: {
    value: {
      title: 'Value',
      description: 'The altitude to reach in [m]',
      type: 'number',
      minimum: 0,
      exclusiveMinimum: 0,
    },
    reference: {
      title: 'Reference',
      description: 'The altitude reference to use',
      type: 'string',
      enum: Object.values(AltitudeReference),
      default: AltitudeReference.HOME,
    },
  },
  required: ['value', 'reference'],
};

export const iconForMissionItemType: Record<MissionItemType, React.ReactNode> =
  {
    [MissionItemType.UNKNOWN]: '?',
    [MissionItemType.TAKEOFF]: <TakeoffIcon />,
    [MissionItemType.LAND]: <LandIcon />,
    [MissionItemType.RETURN_TO_HOME]: <HomeIcon />,
    [MissionItemType.GO_TO]: '#',
    [MissionItemType.CHANGE_ALTITUDE]: <ChangeAltitudeIcon />,
    [MissionItemType.CHANGE_HEADING]: <ChangeHeadingIcon />,
    [MissionItemType.CHANGE_SPEED]: <ChangeSpeedIcon />,
    [MissionItemType.MARKER]: <MarkerIcon />,
    [MissionItemType.SET_PAYLOAD]: <SetPayloadIcon />,
    [MissionItemType.SET_PARAMETER]: <SetParameterIcon />,
    [MissionItemType.UPDATE_GEOFENCE]: <UpdateGeofenceIcon />,
    [MissionItemType.UPDATE_SAFETY]: <UpdateSafetyIcon />,
  };

export const titleForMissionItemType: Record<MissionItemType, string> = {
  [MissionItemType.UNKNOWN]: 'Unknown mission item',
  [MissionItemType.TAKEOFF]: 'Takeoff',
  [MissionItemType.LAND]: 'Land',
  [MissionItemType.RETURN_TO_HOME]: 'Return to home',
  [MissionItemType.GO_TO]: 'Go to waypoint',
  [MissionItemType.CHANGE_ALTITUDE]: 'Change altitude',
  [MissionItemType.CHANGE_HEADING]: 'Change heading',
  [MissionItemType.CHANGE_SPEED]: 'Change speed',
  [MissionItemType.MARKER]: 'Marker',
  [MissionItemType.SET_PAYLOAD]: 'Set payload',
  [MissionItemType.SET_PARAMETER]: 'Set parameter',
  [MissionItemType.UPDATE_GEOFENCE]: 'Update geofence',
  [MissionItemType.UPDATE_SAFETY]: 'Update safety parameters',
};

export const schemaForMissionItemType: Record<
  MissionItemType,
  {
    properties: Record<string, any>;
    required: string[];
  }
> = {
  [MissionItemType.UNKNOWN]: {
    properties: {},
    required: [],
  },
  [MissionItemType.TAKEOFF]: {
    properties: {
      alt: altitudeSchema,
    },
    required: [],
  },
  [MissionItemType.LAND]: {
    properties: {},
    required: [],
  },
  [MissionItemType.RETURN_TO_HOME]: {
    properties: {},
    required: [],
  },
  [MissionItemType.GO_TO]: {
    properties: {
      lat: {
        title: 'Latitude',
        description: 'The latitude to go to in [deg]',
        type: 'number',
        minimum: -90,
        maximum: 90,
      },
      lon: {
        title: 'Longitude',
        description: 'The longitude to go to in [deg]',
        type: 'number',
        minimum: -180,
        maximum: 180,
      },
    },
    required: ['lat', 'lon'],
  },
  [MissionItemType.CHANGE_ALTITUDE]: {
    properties: {
      alt: altitudeSchema,
    },
    required: ['alt'],
  },
  [MissionItemType.CHANGE_HEADING]: {
    properties: {
      heading: {
        title: 'Heading',
        type: 'object',
        properties: {
          value: {
            title: 'Value',
            description: 'The absolute heading to turn to in [deg]',
            type: 'number',
          },
          mode: {
            title: 'Mode',
            description: 'The heading mode to use',
            type: 'string',
            enum: Object.values(HeadingMode),
            default: HeadingMode.ABSOLUTE,
          },
        },
      },
    },
    required: ['heading'],
  },
  [MissionItemType.CHANGE_SPEED]: {
    properties: {
      velocityXY: {
        title: 'Horizontal speed',
        description: 'The horizontal velocity to use in [m/s]',
        type: 'number',
        minimum: 0,
        exclusiveMinimum: 0,
      },
      velocityZ: {
        title: 'Vertical speed',
        description: 'The vertical velocity to use in [m/s]',
        type: 'number',
        minimum: 0,
        exclusiveMinimum: 0,
      },
    },
    required: [],
  },
  [MissionItemType.MARKER]: {
    properties: {},
    required: [],
  },
  [MissionItemType.SET_PAYLOAD]: {
    properties: {},
    required: [],
  },
  [MissionItemType.SET_PARAMETER]: {
    properties: {},
    required: [],
  },
  [MissionItemType.UPDATE_GEOFENCE]: {
    properties: {},
    required: [],
  },
  [MissionItemType.UPDATE_SAFETY]: {
    properties: {},
    required: [],
  },
};

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
 * Returns whether the given parameter representing a heading change in a
 * mission item is valid.
 */
function isHeadingParameterValid(heading: any): heading is Heading {
  if (typeof heading !== 'object') {
    return false;
  }

  const { value, mode } = heading;
  if (
    typeof value !== 'number' ||
    !Number.isFinite(value) ||
    typeof mode !== 'string' ||
    !Object.values(HeadingMode).includes(mode as HeadingMode)
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
      /* "Change speed" items need velocityXY and/or velocityZ */
      {
        const { velocityXY, velocityZ } = parameters;
        if (
          !(typeof velocityXY === 'number' && Number.isFinite(velocityXY)) &&
          !(typeof velocityZ === 'number' && Number.isFinite(velocityZ))
        ) {
          return false;
        }
      }

      break;

    case MissionItemType.LAND:
      break;

    case MissionItemType.MARKER:
      /* Marker mission item type needs a valid marker */
      {
        const { marker } = parameters;
        if (
          typeof marker !== 'string' ||
          !Object.values(MarkerType).includes(marker as MarkerType)
        ) {
          return false;
        }
      }

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

    case MissionItemType.SET_PARAMETER:
      /* "Set parameter" items need a name and a value */
      {
        const { name, value } = parameters;
        if (
          typeof name !== 'string' ||
          (typeof value !== 'string' &&
            (typeof value !== 'number' || !Number.isFinite(value)) &&
            typeof value !== 'boolean')
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
          // TODO: add proper validation for the geofence object
        ) {
          return false;
        }
      }

      break;

    case MissionItemType.UPDATE_SAFETY:
      /* "Update safety" items need complex validation */
      {
        const { safety } = parameters;
        if (
          // TODO: add proper validation for the safety object
          !safety
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
