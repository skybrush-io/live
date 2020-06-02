/**
 * @file Model objects and classes related to the settings of the app.
 */

export const CoordinateFormat = {
  DEGREES: 'd',
  DEGREES_MINUTES: 'dm',
  DEGREES_MINUTES_SECONDS: 'dms',
  SIGNED_DEGREES: '-d',
  SIGNED_DEGREES_MINUTES: '-dm',
  SIGNED_DEGREES_MINUTES_SECONDS: '-dms',
};

const _coordinateFormatDescriptions = {
  [CoordinateFormat.DEGREES]: 'Decimal degrees',
  [CoordinateFormat.DEGREES_MINUTES]: 'Degrees and minutes',
  [CoordinateFormat.DEGREES_MINUTES_SECONDS]: 'Degrees, minutes and seconds',
  [CoordinateFormat.SIGNED_DEGREES]: 'Decimal degrees (signed)',
  [CoordinateFormat.SIGNED_DEGREES_MINUTES]: 'Degrees and minutes (signed)',
  [CoordinateFormat.SIGNED_DEGREES_MINUTES_SECONDS]:
    'Degrees, minutes and seconds (signed)',
};

export const describeCoordinateFormat = (format) =>
  _coordinateFormatDescriptions[format] || 'Unknown format';
