/**
 * @file Model objects and classes related to the settings of the app.
 */

export enum AltitudeSummaryType {
  AMSL = 'amsl',
  AHL = 'ahl',
  AGL = 'agl',
  XYZ = 'xyz',
}

const altitudeSummaryTypeDescriptions = {
  [AltitudeSummaryType.AMSL]: 'Altitude above mean sea level',
  [AltitudeSummaryType.AHL]: 'Altitude above home level',
  [AltitudeSummaryType.AGL]: 'Altitude above ground level',
  [AltitudeSummaryType.XYZ]: 'Altitude in local coordinate system',
};

const altitudeSummaryTypeShortDescriptions = {
  [AltitudeSummaryType.AMSL]: 'AMSL',
  [AltitudeSummaryType.AHL]: 'AHL',
  [AltitudeSummaryType.AGL]: 'AGL',
  [AltitudeSummaryType.XYZ]: 'Z coordinate',
};

export const describeAltitudeSummaryType = (
  type: AltitudeSummaryType,
  { short = false } = {}
): string =>
  (short
    ? altitudeSummaryTypeShortDescriptions
    : altitudeSummaryTypeDescriptions)[type] || 'Unknown altitude type';

export enum CoordinateFormat {
  DEGREES = 'd',
  DEGREES_MINUTES = 'dm',
  DEGREES_MINUTES_SECONDS = 'dms',
  SIGNED_DEGREES = '-d',
  SIGNED_DEGREES_MINUTES = '-dm',
  SIGNED_DEGREES_MINUTES_SECONDS = '-dms',
}

const coordinateFormatDescriptions = {
  [CoordinateFormat.DEGREES]: 'Decimal degrees',
  [CoordinateFormat.DEGREES_MINUTES]: 'Degrees and minutes',
  [CoordinateFormat.DEGREES_MINUTES_SECONDS]: 'Degrees, minutes and seconds',
  [CoordinateFormat.SIGNED_DEGREES]: 'Decimal degrees (signed)',
  [CoordinateFormat.SIGNED_DEGREES_MINUTES]: 'Degrees and minutes (signed)',
  [CoordinateFormat.SIGNED_DEGREES_MINUTES_SECONDS]:
    'Degrees, minutes and seconds (signed)',
};

export const describeCoordinateFormat = (format: CoordinateFormat): string =>
  coordinateFormatDescriptions[format] || 'Unknown format';

export enum BatteryDisplayStyle {
  VOLTAGE = 'voltage',
  PERCENTAGE = 'percentage',
  FORCED_PERCENTAGE = 'forcedPercentage',
}

const batteryDisplayStyleDescriptions = {
  [BatteryDisplayStyle.VOLTAGE]: 'Prefer voltage',
  [BatteryDisplayStyle.PERCENTAGE]:
    'Prefer percentage and show voltage if unknown',
  [BatteryDisplayStyle.FORCED_PERCENTAGE]:
    'Prefer percentage and estimate it from voltage if needed',
};

export const describeBatteryDisplayStyle = (
  style: BatteryDisplayStyle
): string => batteryDisplayStyleDescriptions[style] || 'Unknown style';

/**
 * Enum that describes when we will be asking for user confirmation before
 * performing certain UAV operations.
 */
export enum UAVOperationConfirmationStyle {
  NEVER = 'never',
  ONLY_MULTIPLE = 'onlyMultiple',
  ALWAYS = 'always',
}

const uavOperationConfirmationStyleDescriptions = {
  [UAVOperationConfirmationStyle.NEVER]: 'Never ask for confirmation',
  [UAVOperationConfirmationStyle.ONLY_MULTIPLE]:
    'Confirm when the operation may affect multiple UAVs',
  [UAVOperationConfirmationStyle.ALWAYS]: 'Always ask for confirmation',
};

export const describeUAVOperationConfirmationStyle = (
  style: UAVOperationConfirmationStyle
): string =>
  uavOperationConfirmationStyleDescriptions[style] || 'Unknown style';
