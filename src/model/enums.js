/**
 * Enum representing the possible known flight modes of a UAV.
 */
export const FlightMode = {
  ACRO: 'acro',
  ALTITUDE_HOLD: 'alt',
  CIRCLE: 'circle',
  FOLLOW: 'follow',
  GUIDED: 'guided',
  LAND: 'land',
  LOITER: 'loiter',
  MISSION: 'mission',
  OTHER: 'other',
  POSITION_HOLD: 'pos',
  RTH: 'rth',
  STABILIZE: 'stab',
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
    description: 'Acrobatic',
  },
  [FlightMode.ALTITUDE_HOLD]: {
    abbreviation: 'Alt',
    description: 'Altitude hold',
  },
  [FlightMode.CIRCLE]: {
    abbreviation: 'Circ',
    description: 'Circling around point of interest',
  },
  [FlightMode.FOLLOW]: {
    abbreviation: 'Flw',
    description: 'Following another device',
  },
  [FlightMode.GUIDED]: {
    abbreviation: 'Guid',
    description: 'Guided by companion computer',
  },
  [FlightMode.LAND]: {
    abbreviation: 'Land',
    description: 'Autonomous landing',
  },
  [FlightMode.LOITER]: {
    abbreviation: 'Loit',
    description: 'Posiiton hold with manual velocity control',
  },
  [FlightMode.MISSION]: {
    abbreviation: 'Wp',
    description: 'Following pre-programmed mission',
  },
  [FlightMode.OTHER]: {
    abbreviation: 'Othr',
    description: 'Other, unspecified flight mode',
  },
  [FlightMode.POSITION_HOLD]: {
    abbreviation: 'Pos',
    description: 'Position hold with manual attitude control',
  },
  [FlightMode.RTH]: {
    abbreviation: 'RTH',
    description: 'Autonomous return to home',
  },
  [FlightMode.STABILIZE]: {
    abbreviation: 'Stab',
    description: 'Roll and pitch stabilization',
  },
  [FlightMode.UNKNOWN]: {
    abbreviation: '----',
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
  },
  [GPSFixType.NO_FIX]: {
    abbreviation: '',
    description: 'No GPS fix obtained',
  },
  [GPSFixType.FIX_2D]: {
    abbreviation: '2D',
    description: '2D GPS fix',
  },
  [GPSFixType.FIX_3D]: {
    abbreviation: '3D',
    description: '3D GPS fix',
  },
  [GPSFixType.DGPS]: {
    abbreviation: 'DGPS',
    description: '3D GPS fix with DGPS/SBAS',
  },
  [GPSFixType.RTK_FLOAT]: {
    abbreviation: 'RTK',
    description: 'RTK float',
  },
  [GPSFixType.RTK_FIXED]: {
    abbreviation: 'RTK+',
    description: 'RTK fixed',
  },
  [GPSFixType.UNKNOWN]: {
    abbreviation: '----',
    description: 'Unknown GPS fix type',
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
