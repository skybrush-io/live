/**
 * @file Parser functions for various data types.
 */

import moment from 'moment'

/**
 * Parses a date that is formatted according to ISO 8601 from a string.
 *
 * @param  {string}  value  the date to parse from a string
 * @return {Date} the parsed date
 */
export const parseISODate = (value) => (
  (value !== undefined) ? moment(value, moment.ISO_8601).toDate() : undefined
)
