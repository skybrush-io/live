/**
 * @file Parser functions for various data types.
 */

import isString from 'lodash/isString'
import moment from 'moment'

/**
 * Object mapping known epoch names to their corresponding date objects.
 */
const knownEpochs = {
  unix: new Date(0)
}

/**
 * Converts a Date object to the number of seconds since the UNIX epoch,
 * handling nulls and undefined values gracefully.
 *
 * @param  {?Date}    value  the date object to convert
 * @return {?Number}  the number of seconds since the UNIX epoch at the
 *         given date, or null if the date was null, or undefined if the
 *         date was undefined
 */
export function dateToTimestamp (value) {
  if (value === undefined) {
    return undefined
  } else if (value === null) {
    return null
  } else {
    return value.getTime() / 1000
  }
}

/**
 * Parses a string that contains either a date in ISO 8601 format or the
 * name of a commonly known epoch.
 *
 * @param  {string}  value  the string to parse
 * @return {Date} the parsed date
 */
export const parseEpochIdentifierOrISODate = (value) => (
  (isString(value) ? knownEpochs[value] : null) || parseISODate(value)
)

/**
 * Parses a date that is formatted according to ISO 8601 from a string.
 *
 * @param  {string}  value  the date to parse from a string
 * @return {Date} the parsed date
 */
export const parseISODate = (value) => (
  (value !== undefined) ? moment(value, moment.ISO_8601).toDate() : undefined
)
