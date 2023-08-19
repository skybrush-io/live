/**
 * @file Parser functions for various data types.
 */

import parseISO from 'date-fns/parseISO';
import has from 'lodash-es/has';
import isString from 'lodash-es/isString';

/**
 * Object mapping known epoch names to their corresponding timestamps (number
 * of seconds) relative to the UNIX epoch.
 */
const knownEpochs: Record<string, number> = {
  unix: 0,
};

/**
 * Parses a duration in hours-minutes-seconds format to an ordinal number of
 * seconds. Returns NaN if the input is invalid.
 *
 * Note: Leading zeroes are optional, hours and minutes can be omitted.
 *
 * @example
 * ```
 * // 1 hour + 23 minutes + 45 seconds = 5025 seconds
 * parseDurationHMS('01:23:45') // 5025
 *
 * // 1 hour + 23 minutes + 45 seconds = 5025 seconds
 * parseDurationHMS('1:23:45') // 5025
 *
 * // 23 minutes + 45 seconds = 1425 seconds
 * parseDurationHMS('23:45') // 1425
 *
 * // 45 seconds = 45 seconds
 * parseDurationHMS('45') // 45
 * ```
 */
export function parseDurationHMS(value: string): number {
  // The generic case would return the same result anyway, but at the
  // request of @ntamas, the special case remains handled separately.
  if (value === '') {
    return 0;
  }

  const parts = value.split(':');

  if (parts.length <= 3) {
    const numericParts = parts.map((part) =>
      part.length > 0 ? Number.parseFloat(part) : 0
    );

    if (numericParts.every((x) => Number.isFinite(x))) {
      return numericParts.reduce((acc, np) => acc * 60 + np, 0);
    }
  }

  return Number.NaN;
}

/**
 * Parses a string that contains either a date in ISO 8601 format or the
 * name of a commonly known epoch.
 *
 * @param value - The string to parse
 * @returns The parsed date as a timestamp
 */
export const parseEpochIdentifierOrISODate = (value: string): number => {
  if (isString(value) && has(knownEpochs, value)) {
    return knownEpochs[value]!; // NOTE: Bang justified by `has`
  }

  return parseISODate(value);
};

/**
 * Parses a date that is formatted according to ISO 8601 from a string, and
 * returns the corresponding UNIX timestamp, in milliseconds.
 *
 * @param value - The date to parse from a string
 * @returns The parsed UNIX timestamp, in milliseconds
 */
export const parseISODate = (value: string): number =>
  parseISO(value).getTime();
