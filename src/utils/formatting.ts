import formatISO9075 from 'date-fns/formatISO9075';
import fromUnixTime from 'date-fns/fromUnixTime';
import isNil from 'lodash-es/isNil';

/**
 * Formats a coordinate array as (X, Y, Z).
 */
export function formatCoordinateArray(coords: number[]): string {
  return `(${coords.map((coord) => coord.toFixed(2)).join(', ')})`;
}

/**
 * Formats a short (less than an hour) duration as minutes:seconds or
 * a long (not less than an hour) duration as hours:minutes:seconds.
 * A placeholder is returned in case of missing input data.
 */
export function formatDuration(duration?: number): string {
  return duration === undefined
    ? '--:--:--'
    : (duration < 60 * 60 ? formatDurationMS : formatDurationHMS)(duration);
}

/**
 * Formats a duration as minutes:seconds.
 */
export function formatDurationMS(duration: number): string {
  duration = Math.round(duration);

  const minutes = String(Math.floor(duration / 60));
  const seconds = String(Math.floor(duration) % 60);

  return `${minutes}:${seconds.padStart(2, '0')}`;
}

/**
 * Formats a duration as hours:minutes:seconds.
 */
export function formatDurationHMS(
  duration: number,
  options: { padHours?: boolean; precision?: number } = {}
): string {
  if (duration < 0) {
    return '-' + formatDurationHMS(-duration, options);
  }

  const { padHours } = options;
  let { precision = 0 } = options;

  precision = Math.max(Math.floor(precision), 0);
  if (precision > 0) {
    const power = 10 ** precision;
    duration = Math.round(duration * power) / power;
  }

  let hours = String(Math.floor(duration / 3600));
  if (padHours && hours.length < 2) {
    hours = '0' + hours;
  }

  duration %= 3600;

  let minutes = String(Math.floor(duration / 60));
  if (minutes.length < 2) {
    minutes = '0' + minutes;
  }

  duration %= 60;

  let seconds = duration.toFixed(precision);
  if (duration < 10) {
    seconds = '0' + seconds;
  }

  return `${hours}:${minutes}:${seconds}`;
}

/**
 * Formats a mission-specific ID in a consistent manner
 * that is to be used everywhere throughout the UI.
 *
 * Indices as input arguments are zero-based,
 * but they are formatted as 1-based on the UI.
 */
export function formatMissionId(index: number): string {
  return `s${index + 1}`;
}

export type UnitDescriptor = {
  multiplier: number;
  unit: string;
  digits?: number;
  breakpoint?: number;
};

/**
 * Data amount unit array suitable to be used with `formatNumberAndUnit`
 * in order to format byte based file sizes nicely.
 */
export const DATA_UNITS: UnitDescriptor[] = [
  { multiplier: 1e9, unit: 'GB' },
  { multiplier: 1e6, unit: 'MB' },
  { multiplier: 1e3, unit: 'KB' },
  { multiplier: 1, unit: 'B' },
];

/**
 * Distance unit array suitable to be used with `formatNumberAndUnit`
 * in order to format meter based distances nicely
 */
export const DISTANCE_UNITS: UnitDescriptor[] = [
  { multiplier: 1000, unit: 'km' },
  { multiplier: 1, unit: 'm' },
  { multiplier: 0.01, unit: 'cm' },
];

/**
 * Area unit array suitable to be used with `formatNumberAndUnit`
 * in order to format square meter based areas nicely
 */
export const AREA_UNITS: UnitDescriptor[] = [
  { multiplier: 1000 ** 2, unit: 'km²' },
  { multiplier: 100 ** 2, unit: 'ha', breakpoint: 0.1 },
  { multiplier: 1, unit: 'm²' },
];

/**
 * Speed unit array suitable to be used with `formatNumberAndUnit`
 * in order to format meter per second based speeds nicely
 */
export const SPEED_UNITS: UnitDescriptor[] = [{ multiplier: 1, unit: 'm/s' }];

/**
 * Helper function to join an amount string and a unit string with or without a
 * space, based on whether the unit starts with a letter or a special character.
 *
 * @param amount - The quantity
 * @param unit - The symbol
 */
export const joinUnit = (amount: string, unit: string): string =>
  amount + (/^[a-zA-Z]/.test(unit) ? '\u00A0' : '') + unit;

/**
 * Helper function that formats a number with a fixed number of decimal digits
 * and an optional unit.
 *
 * @param number - The number to format
 * @param unit - The unit to show after the digits. May also be an array
 *        consisting of unit descriptors with required `multiplier` and `unit`
 *        fields and optional `breakpoint` and `digits` fields
 *        (e.g., [
 *          { multiplier: 1000, unit: 'km' },
 *          { multiplier: 1, unit: 'm' },
 *          { multiplier: 0.01, unit: 'cm', digits: 0 },
 *        ])
 * @param digits - The number of decimal digits to use; defaults to zero
 */
export const formatNumberAndUnit = (
  number: number,
  unit: UnitDescriptor[] | string = '',
  digits = 0
): string => {
  if (Array.isArray(unit) && unit.length > 0) {
    // Choose the largest possible unit that has a breakpoint below the number,
    // or the smallest unit if none of them satisfy this predicate
    const {
      multiplier: mul,
      unit: u,
      digits: dig = digits,
    } = (unit.find(
      ({ multiplier, breakpoint = 1 }) =>
        breakpoint <= Math.abs(number) / multiplier
    ) ?? unit.at(-1))!;

    return joinUnit(number === 0 ? '0' : (number / mul).toFixed(dig), u);
  } else {
    return joinUnit(
      number === 0 ? '0' : number.toFixed(digits),
      typeof unit === 'string' ? unit : ''
    );
  }
};

/**
 * Helper function that formats a data amount expressed in bytes in a nice
 * human-readable manner.
 */
export const formatData = (number: number, digits = 2): string =>
  formatNumberAndUnit(number, DATA_UNITS, digits);

/**
 * Helper function that formats a distance expressed in meters in a nice
 * human-readable manner.
 */
export const formatDistance = (number: number, digits = 2): string =>
  formatNumberAndUnit(number, DISTANCE_UNITS, digits);

/**
 * Helper function that formats an area expressed in square meters in a nice
 * human-readable manner.
 */
export const formatArea = (number: number, digits = 2): string =>
  formatNumberAndUnit(number, AREA_UNITS, digits);

/**
 * Helper function that formats a speed expressed in meters per second
 * in a nice human-readable manner.
 */
export const formatSpeed = (number: number, digits = 2): string =>
  formatNumberAndUnit(number, SPEED_UNITS, digits);

/**
 * Helper function that formats an interval of items.
 *
 * @param items  The array of items to format.
 * @param formatter  The function to use to convert items to
 *        their string representation.
 */
export const formatItemInterval = <TItem>(
  items: Array<TItem>,
  formatter: (item: TItem) => string = String
) => {
  if (items.length === 0) {
    return '—';
  } else if (items.length === 1) {
    return formatter(items[0]!);
  } else {
    return `${formatter(items[0]!)}-${formatter(items.at(-1)!)}`;
  }
};

/**
 * Formats a list of IDs in a manner that is suitable for cases when we
 * expect the list to contain only a few items, and we are not interested in
 * all of them if there are too many.
 *
 * @param ids - The array of IDs to format
 * @param maxCount - The maximum number of UAV IDs to show before
 *                   adding the "+X more" suffix
 * @returns The formatted UAV ID list
 */
export function formatIdsAndTruncateTrailingItems(
  ids: string[],
  { maxCount = 8, separator = ' · ' } = {}
): string {
  const length = Array.isArray(ids) ? ids.length : 0;
  if (length === 0) {
    return '';
  }

  if (length > maxCount) {
    return `${ids.slice(0, maxCount - 1).join(separator)} and ${
      length - maxCount + 1
    } more`;
  }

  return ids.join(separator);
}

/**
 * Formats a number in a null-safe manner, replacing nil and NaN with an
 * appropriate text.
 *
 * @param x - The number to format
 * @param digits - The number of decimal digits to keep
 * @param unit - Optional suffix to append after the number
 * @param naText - Text to return when the input is nil or NaN
 */
export const formatNumberSafely = (
  x: number,
  digits = 0,
  unit = '',
  naText = '—'
): string =>
  // TODO: `isNil` check will be superfluous once argument types are enforced.
  isNil(x) || Number.isNaN(x)
    ? naText
    : typeof x === 'number'
      ? unit
        ? `${x.toFixed(digits)}${unit}`
        : x.toFixed(digits)
      : x;

/**
 * Formats a UNIX timestamp in seconds as human-readable text.
 */
export const formatUnixTimestamp = (timestamp: number, naText = '—'): string =>
  // TODO: `isNil` check will be superfluous once argument types are enforced.
  isNil(timestamp) || Number.isNaN(timestamp)
    ? naText
    : formatISO9075(fromUnixTime(timestamp));

/**
 * Twitter-style short formatter for TimeAgo components
 */
export const shortTimeAgoFormatter = (value: number, unit: string): string =>
  unit === 'month'
    ? `${value}mo`
    : unit === 'second' && value < 1
      ? 'now'
      : `${value}${unit.charAt(0)}`;

/**
 * Twitter-style short formatter for TimeAgo components that is suitable for
 * both past and future timestamps.
 */
export const shortRelativeTimeFormatter = (
  value: number,
  unit: string,
  suffix: string
): string => {
  const base = shortTimeAgoFormatter(value, unit);
  return base === 'now'
    ? base
    : suffix === 'ago'
      ? `${base} ago`
      : `in ${base}`;
};

/**
 * Truncates a string with ellipses if it exceeds a certain length.
 */
export function truncate(
  value: string,
  maxLength: number,
  { ellipsis = '…' } = {}
): string {
  // TODO: `isNil` check will be superfluous once argument types are enforced.
  if (isNil(value)) {
    return '';
  }

  if (typeof value !== 'string') {
    value = String(value);
  }

  if (value.length > maxLength) {
    value = value.slice(0, maxLength) + ellipsis;
  }

  return value;
}

/**
 * Formats a single RSSI percentage as a string.
 *
 * Note that negative RSSI values in Skybrush mean "unknown" so we treat them
 * as such.
 */
export function formatRSSI(rssi?: number): string {
  if (
    rssi === undefined ||
    rssi === null ||
    rssi < 0 ||
    !Number.isFinite(rssi)
  ) {
    return '—';
  } else {
    return rssi.toFixed(0) + '%';
  }
}
