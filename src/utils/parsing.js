/**
 * @file Parser functions for various data types.
 */

import parse from 'date-fns/parse';
import has from 'lodash-es/has';
import isString from 'lodash-es/isString';

/**
 * Object mapping known epoch names to their corresponding timestamps (number
 * of seconds) relative to the UNIX epoch.
 */
const knownEpochs = {
  unix: 0,
};

/**
 * Parses a duration in hours-minutes-seconds format to an ordinal number of
 * seconds. Returns NaN if the input is invalid.
 */
export function parseDurationHMS(value) {
  const parts =
    typeof value === 'string' && value.length > 0 ? value.split(':') : [];

  if (parts.length === 0) {
    return 0;
  }

  if (parts.length <= 3) {
    const numericParts = parts.map((part) =>
      part.length > 0 ? Number.parseFloat(part, 10) : 0
    );
    if (numericParts.every((x) => Number.isFinite(x))) {
      let result = 0;
      let mul = 1;
      while (numericParts.length > 0) {
        result += numericParts.pop() * mul;
        mul *= 60;
      }

      return result;
    }
  }

  return Number.NaN;
}

/**
 * Parses a string that contains either a date in ISO 8601 format or the
 * name of a commonly known epoch.
 *
 * @param  {string}  value  the string to parse
 * @return {number} the parsed date as a timestamp
 */
export const parseEpochIdentifierOrISODate = (value) => {
  if (isString(value) && has(knownEpochs, value)) {
    return knownEpochs[value];
  }

  return parseISODate(value);
};

/**
 * Parses a date that is formatted according to ISO 8601 from a string, and
 * returns the corresponding UNIX timestamp, in milliseconds.
 *
 * @param  {string}  value  the date to parse from a string
 * @return {number} the parsed UNIX timestamp, in milliseconds.
 */
export const parseISODate = (value) =>
  value === undefined ? undefined : parse(value).getTime();
