/**
 * @file Module that provides a generic error handler function that ties
 * nicely into the main application.
 */

import { addErrorItem } from './utils/logging'

import isFunction from 'lodash/isFunction'

/**
 * Converts an arbitrary error object into a string if it is not a string
 * already.
 *
 * @param {Object}  err  the error object to convert
 * @return {string} the error object converted into a string
 */
function errorToString (err) {
  if (err.toString && isFunction(err.toString)) {
    return err.toString()
  } else {
    return String(err)
  }
}

/**
 * Handles the given error object gracefully within the application.
 *
 * @param  {Error}  err  the error to handle
 */
export default function handleError (err) {
  addErrorItem(errorToString(err))
}
