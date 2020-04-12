/**
 * @file Parser functions for various data types.
 */

import has from 'lodash-es/has';
import isString from 'lodash-es/isString';
import moment from 'moment';

/**
 * Object mapping known epoch names to their corresponding date objects.
 */
const knownEpochs = {
  unix: moment(0).valueOf()
};

/**
 * Converts a Date object to the number of seconds since the UNIX epoch,
 * handling nulls and undefined values gracefully.
 *
 * @param  {?Date}    value  the date object to convert
 * @return {?number}  the number of seconds since the UNIX epoch at the
 *         given date, or null if the date was null, or undefined if the
 *         date was undefined
 */
export function dateToTimestamp(value) {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  return value.getTime() / 1000;
}

/**
 * Parses a string that contains either a date in ISO 8601 format or the
 * name of a commonly known epoch.
 *
 * @param  {string}  value  the string to parse
 * @return {Date} the parsed date
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
  value === undefined ? undefined : moment(value, moment.ISO_8601).valueOf();
