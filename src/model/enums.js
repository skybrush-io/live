import { Status } from '~/components/semantics';

/**
 * Enum containing constants for the various messages types.
 */
export const MessageType = {
  OUTBOUND: 'outbound',
  INBOUND: 'inbound',
  ERROR: 'error',
};

/**
 * Enum containing log message severities from the Flockwave protocol.
 */
export const Severity = {
  DEBUG: 'debug',
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
  CRITICAL: 'critical',
};

/**
 * Enum representing the known types (formats) of flight logs.
 */
export const FlightLogKind = {
  UNKNOWN: 'unknown',
  TEXT: 'text',
  ARDUPILOT: 'ardupilot',
  ULOG: 'ulog',
  FLOCKCTRL: 'flockctrl',
};

/**
 * Object mapping flight log types to their properties (human readable
 * descriptions etc).
 */
const _propertiesForFlightLogKinds = {
  [FlightLogKind.UNKNOWN]: {
    label: 'Unknown',
    description: 'Unknown flight log format',
  },
  [FlightLogKind.TEXT]: {
    label: 'Plain text',
    description: 'Plain text flight log',
  },
  [FlightLogKind.ARDUPILOT]: {
    label: 'ArduPilot',
    description: 'ArduPilot flight log',
  },
  [FlightLogKind.ULOG]: {
    label: 'PX4 ULog',
    description: 'PX4 ULog flight log',
  },
  [FlightLogKind.FLOCKCTRL]: {
    label: 'FlockCtrl',
    description: 'FlockCtrl high-level flight log',
  },
};

/**
 * Returns the description of the given flight log kind / format.
 */
export function describeFlightLogKind(kind) {
  const props =
    _propertiesForFlightLogKinds[kind] ||
    _propertiesForFlightLogKinds[FlightLogKind.UNKNOWN];
  return props.description;
}

/**
 * Returns the label of the given flight log kind / format.
 */
export function getFlightLogKindLabel(kind) {
  const props = _propertiesForFlightLogKinds[kind];
  return props ? props.label : String(kind);
}

/**
 * Enum representing the possible known flight modes of a UAV.
 */
export const FlightMode = {
  ACRO: 'acro',
  ALTITUDE_HOLD: 'alt',
  AUTO: 'auto',
  CIRCLE: 'circle',
  FLOW_HOLD: 'flow',
  FOLLOW: 'follow',
  GUIDED: 'guided',
  LAND: 'land',
  LOITER: 'loiter',
  MISSION: 'mission',
  OTHER: 'other',
  PRECISION_LANDING: 'precland',
  POSITION_HOLD: 'pos',
  RTH: 'rth',
  SHOW: 'show',
  SIMPLE: 'simple',
  STABILIZE: 'stab',
  TAKEOFF: 'takeoff',
  UNKNOWN: 'unknown',
};

/**
 * Object mapping flight mode constants to their properties (human readable
 * descriptions, abbreviations etc).
 *
 * Abbreviations are guaranteed to be at most 4 characters.
 */
const _propertiesForFlightModes = {
  [FlightMode.ACRO]: {
    abbreviation: 'Acro',
    label: 'Acrobatic',
    description: 'Acrobatic',
  },
  [FlightMode.ALTITUDE_HOLD]: {
    abbreviation: 'Alt',
    label: 'Altitude hold',
    description: 'Altitude hold',
  },
  [FlightMode.AUTO]: {
    abbreviation: 'Auto',
    label: 'Automatic',
    description: 'Automatic',
  },
  [FlightMode.CIRCLE]: {
    abbreviation: 'Circ',
    label: 'Circling',
    description: 'Circling around point of interest',
  },
  [FlightMode.FLOW_HOLD]: {
    abbreviation: 'Flow',
    label: 'Optical flow hold',
    description: 'Optical flow hold',
  },
  [FlightMode.FOLLOW]: {
    abbreviation: 'Flw',
    label: 'Following',
    description: 'Following another device',
    status: Status.SUCCESS,
  },
  [FlightMode.GUIDED]: {
    abbreviation: 'Guid',
    label: 'Guided',
    description: 'Guided by companion computer',
    status: Status.SUCCESS,
  },
  [FlightMode.LAND]: {
    abbreviation: 'Land',
    label: 'Landing',
    description: 'Autonomous landing',
    status: Status.WARNING,
  },
  [FlightMode.LOITER]: {
    abbreviation: 'Loit',
    label: 'Loiter',
    description: 'Posiiton hold with manual velocity control',
  },
  [FlightMode.MISSION]: {
    abbreviation: 'Wp',
    label: 'Mission',
    description: 'Following pre-programmed mission',
    status: Status.SUCCESS,
  },
  [FlightMode.OTHER]: {
    abbreviation: 'Othr',
    label: 'Other',
    description: 'Other, unspecified flight mode',
  },
  [FlightMode.PRECISION_LANDING]: {
    abbreviation: 'Plnd',
    label: 'Precision landing',
    description: 'Autonomous precision landing',
  },
  [FlightMode.POSITION_HOLD]: {
    abbreviation: 'Pos',
    label: 'Position hold',
    description: 'Position hold with manual attitude control',
  },
  [FlightMode.RTH]: {
    abbreviation: 'RTH',
    label: 'Return to home',
    description: 'Autonomous return to home',
    status: Status.RTH,
  },
  [FlightMode.SHOW]: {
    abbreviation: 'Show',
    label: 'Drone show',
    description: 'Executing a drone show',
    status: Status.SUCCESS,
  },
  [FlightMode.SIMPLE]: {
    abbreviation: 'Simp',
    label: 'Simple',
    description: 'Simplified aided flight mode',
  },
  [FlightMode.STABILIZE]: {
    abbreviation: 'Stab',
    label: 'Stabilize',
    description: 'Roll and pitch stabilization',
  },
  [FlightMode.TAKEOFF]: {
    abbreviation: 'Take',
    label: 'Takeoff',
    description: 'Autonomous takeoff',
  },
  [FlightMode.UNKNOWN]: {
    abbreviation: '----',
    label: 'Unknown',
    description: 'Unknown flight mode',
  },
};

/**
 * Returns the abbreviation of the given flight mode.
 */
export function abbreviateFlightMode(mode) {
  const effectiveMode =
    mode && typeof mode === 'string' ? mode : FlightMode.UNKNOWN;
  const props = _propertiesForFlightModes[effectiveMode];
  return props ? props.abbreviation : mode.slice(0, 4);
}

/**
 * Returns the description of the given flight mode.
 */
export function describeFlightMode(mode) {
  const props =
    _propertiesForFlightModes[mode] ||
    _propertiesForFlightModes[FlightMode.UNKNOWN];
  return props.description;
}

/**
 * Returns the label of the given flight mode.
 */
export function getFlightModeLabel(mode) {
  const props = _propertiesForFlightModes[mode];
  return props ? props.label : String(mode).toUpperCase();
}

/**
 * Returns the semantic status code of the given flight mode.
 */
export function getSemanticsForFlightMode(mode) {
  const props =
    _propertiesForFlightModes[mode] ||
    _propertiesForFlightModes[FlightMode.UNKNOWN];
  return props.status;
}

/* ************************************************************************* */

/**
 * Enum representing the possible known GPS fix types of a UAV.
 */
export const GPSFixType = {
  NO_GPS: 0,
  NO_FIX: 1,
  FIX_2D: 2,
  FIX_3D: 3,
  DGPS: 4,
  RTK_FLOAT: 5,
  RTK_FIXED: 6,
  STATIC: 7,
  UNKNOWN: 8,
};

/**
 * Object mapping GPS fix type constants to their properties (human readable
 * descriptions, abbreviations etc).
 *
 * Abbreviations are guaranteed to be at most 4 characters.
 */
const _propertiesForGPSFixTypes = {
  [GPSFixType.NO_GPS]: {
    abbreviation: '',
    description: 'No GPS connected',
    status: Status.ERROR,
  },
  [GPSFixType.NO_FIX]: {
    abbreviation: '',
    description: 'No GPS fix obtained',
    status: Status.ERROR,
  },
  [GPSFixType.FIX_2D]: {
    abbreviation: '2D',
    description: '2D GPS fix',
    status: Status.WARNING,
  },
  [GPSFixType.FIX_3D]: {
    abbreviation: '3D',
    description: '3D GPS fix',
    status: Status.WARNING,
  },
  [GPSFixType.DGPS]: {
    abbreviation: 'DGPS',
    description: '3D GPS fix with DGPS/SBAS',
    status: Status.SUCCESS,
  },
  [GPSFixType.RTK_FLOAT]: {
    abbreviation: 'RTK',
    description: 'RTK float',
    status: Status.SUCCESS,
  },
  [GPSFixType.RTK_FIXED]: {
    abbreviation: 'RTK+',
    description: 'RTK fixed',
    status: Status.SUCCESS,
  },
  [GPSFixType.STATIC]: {
    abbreviation: 'STA',
    description: 'Static position',
    status: Status.SUCCESS,
  },
  [GPSFixType.UNKNOWN]: {
    abbreviation: '----',
    description: 'Unknown GPS fix type',
    status: Status.WARNING,
  },
};

/**
 * Returns the abbreviation of the given GPS fix type.
 */
export function abbreviateGPSFixType(fixType) {
  const props =
    _propertiesForGPSFixTypes[fixType] ||
    _propertiesForGPSFixTypes[GPSFixType.UNKNOWN];
  return props.abbreviation;
}

/**
 * Returns the description of the given GPS fix type.
 */
export function describeGPSFixType(fixType) {
  const props =
    _propertiesForGPSFixTypes[fixType] ||
    _propertiesForGPSFixTypes[GPSFixType.UNKNOWN];
  return props.description;
}

/**
 * Returns the semantic status code of the given GPS fix type.
 */
export function getSemanticsForGPSFixType(fixType) {
  const props =
    _propertiesForGPSFixTypes[fixType] ||
    _propertiesForGPSFixTypes[GPSFixType.UNKNOWN];
  return props.status;
}

/* ************************************************************************* */

/**
 * Enum representing the possible preflight check results on a UAV.
 */
export const PreflightCheckResult = {
  OFF: 'off',
  PASS: 'pass',
  WARNING: 'warning',
  RUNNING: 'running',
  SOFT_FAILURE: 'softFailure',
  FAILURE: 'failure',
  ERROR: 'error',
  UNKNOWN: 'unknown',
};

/**
 * Object mapping preflight check result constants to their properties (human
 * readable descriptions etc).
 *
 * Abbreviations are guaranteed to be at most 4 characters.
 */
const _propertiesForPreflightCheckResults = {
  [PreflightCheckResult.OFF]: {
    description: 'Disabled',
    overallDescription: 'All preflight checks are disabled',
    status: Status.OFF,
  },
  [PreflightCheckResult.PASS]: {
    description: 'OK',
    overallDescription: 'Preflight checks passed',
    status: Status.SUCCESS,
  },
  [PreflightCheckResult.WARNING]: {
    description: 'Needs attention',
    overallDescription: 'Some preflight check items need attention',
    status: Status.WARNING,
  },
  [PreflightCheckResult.RUNNING]: {
    description: 'Check in progress...',
    overallDescription: 'Preflight checks are in progress...',
    status: Status.WAITING,
  },
  [PreflightCheckResult.SOFT_FAILURE]: {
    description: 'Temporary failure',
    overallDescription: 'Some preflight checks failed temporarily',
    status: Status.WARNING,
  },
  [PreflightCheckResult.FAILURE]: {
    description: 'Failed',
    overallDescription: 'Preflight checks failed',
    status: Status.ERROR,
  },
  [PreflightCheckResult.ERROR]: {
    description: 'Error while executing test',
    overallDescription: 'Error while executing preflight checks',
    status: Status.CRITICAL,
  },
  [PreflightCheckResult.UNKNOWN]: {
    description: 'Unknown test result',
    overallDescription: 'Unknown preflight test result',
    status: Status.OFF,
  },
};

/**
 * Returns the description of the given preflight check result.
 */
export function describePreflightCheckResult(result) {
  const props =
    _propertiesForPreflightCheckResults[result] ||
    _propertiesForPreflightCheckResults[PreflightCheckResult.UNKNOWN];
  return props.description;
}

/**
 * Returns the description of the given preflight check result.
 */
export function describeOverallPreflightCheckResult(result) {
  const props =
    _propertiesForPreflightCheckResults[result] ||
    _propertiesForPreflightCheckResults[PreflightCheckResult.UNKNOWN];
  return props.overallDescription;
}

/**
 * Returns the semantic status code of the given GPS fix type.
 */
export function getSemanticsForPreflightCheckResult(result) {
  const props =
    _propertiesForPreflightCheckResults[result] ||
    _propertiesForPreflightCheckResults[PreflightCheckResult.UNKNOWN];
  return props.status;
}
