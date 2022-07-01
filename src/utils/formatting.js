import isNil from 'lodash-es/isNil';

/**
 * Formats a coordinate array as (X, Y, Z)
 */
export function formatCoordinateArray(coords) {
  return `(${coords.map((coord) => coord.toFixed(2)).join(', ')})`;
}

/**
 * Formats a duration as minutes:seconds.
 */
export function formatDuration(duration) {
  duration = Math.round(duration);

  const minutes = Math.floor(duration / 60);
  let seconds = String(Math.floor(duration) % 60);
  if (seconds.length < 2) {
    seconds = '0' + seconds;
  }

  return `${minutes}:${seconds}`;
}

/**
 * Formats a duration as hours:minutes:seconds.
 */
export function formatDurationHMS(duration, options = {}) {
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
 * Formats a mission-specific ID in a consistent manner that is to be used
 * everywhere throughout the UI.
 *
 * Indices as input arguments are zero-based, but they are formatted as 1-based
 * on the UI.
 */
export function formatMissionId(index) {
  return `s${index + 1}`;
}

/**
 * Formats a mission-specific ID range in a consistent manner that is to be used
 * everywhere throughout the UI.
 *
 * Indices as input arguments are zero-based, but they are formatted as 1-based
 * on the UI. The start index is inclusive and the end index is exclusive.
 */
export function formatMissionIdRange(start, end) {
  if (end <= start) {
    return '';
  } else if (end === start + 1) {
    return formatMissionId(start);
  } else {
    return `${formatMissionId(start)}\u2013${end}`;
  }
}

// Distance unit array suitable to be used with formatNumberAndUnit in order to
// format distances nicely
export const DISTANCE_UNITS = [
  [1000, 'km'],
  [1, 'm'],
  [0.01, 'cm'],
];

/**
 * Helper function that formats a number with a fixed number of decimal digits
 * and an optional unit.
 *
 * @param {number}  number  the number to format
 * @param {string|Object} unit  the unit to show after the digits. May also be
 *        an array consisting of pairs of a multiplier and the corresponding
 *        unit (e.g., [[1000, 'km'], [1, 'm'], [0.01, 'cm']])
 * @param {number?} digits  the number of decimal digits to use; defaults to zero
 */
export const formatNumberAndUnit = (number, unit = '', digits = 0) => {
  if (Array.isArray(unit) && unit.length > 0) {
    for (const [mul, u] of unit) {
      if (Math.abs(number) >= mul) {
        return (number / mul).toFixed(digits) + u;
      }
    }

    const [mul, u] = unit[unit.length - 1];
    return number === 0 ? number + u : (number / mul).toFixed(digits) + u;
  } else {
    return number === 0 ? number + unit : number.toFixed(digits) + unit;
  }
};

/**
 * Helper function that formats a distance expressed in meters in a nice
 * human-readable manner.
 */
export const formatDistance = (number, digits = 2) =>
  formatNumberAndUnit(number, DISTANCE_UNITS, digits);

/**
 * Formats a list of IDs in a manner that is suitable for cases when we
 * expect the list to contain only a few items, and we are not interested in
 * all of them if there are too many.
 *
 * @param  {string[]}  uavIds  the array of IDs to format
 * @param  {number}    maxCount  the maximum number of UAV IDs to show before
 *         adding the "+X more" suffix
 * @return {string}  the formatted UAV ID list
 */
export function formatIdsAndTruncateTrailingItems(
  ids,
  { maxCount = 8, separator = ' \u00B7 ' } = {}
) {
  const length = Array.isArray(ids) ? ids.length : 0;
  if (length === 0) {
    return '';
  }

  if (length > maxCount) {
    return (
      ids.slice(0, maxCount - 1).join(separator) +
      ' and ' +
      (length - maxCount + 1) +
      ' more'
    );
  }

  return ids.join(separator);
}

/**
 * Formats a number in a null-safe manner, replacing nil and NaN with an
 * appropriate text.
 *
 * @param {number} x  the number to format
 * @param {number} digits  the number of decimal digits to keep
 * @param {string} unit    optional suffix to append after the number
 * @param {string} naText  text to return when the input is nil or NaN
 */
export const formatNumberSafely = (x, digits = 0, unit = '', naText = '—') =>
  isNil(x) || Number.isNaN(x)
    ? naText
    : typeof x === 'number'
    ? unit
      ? `${x.toFixed(digits)}${unit}`
      : x.toFixed(digits)
    : x;

/**
 * Twitter-style short formatter for TimeAgo components
 */
export const shortTimeAgoFormatter = (value, unit) =>
  unit === 'month'
    ? `${value}mo`
    : unit === 'second' && value < 1
    ? 'now'
    : `${value}${unit.charAt(0)}`;

/**
 * Twitter-style short formatter for TimeAgo components that is suitable for
 * both past and future timestamps.
 */
export const shortRelativeTimeFormatter = (value, unit, suffix) => {
  const base = shortTimeAgoFormatter(value, unit, suffix);
  return base === 'now'
    ? base
    : suffix === 'ago'
    ? `${base} ago`
    : `in ${base}`;
};

/**
 * Truncates a string with ellipses if it exceeds a certain length.
 */
export function truncate(value, maxLength, { ellipsis = '\u2026' } = {}) {
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
