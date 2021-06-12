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
