/**
 * @file Module that provides generic error handler functions and
 * components that tie nicely into the main application.
 */

import AlertWarning from '@material-ui/icons/Warning'
import PropTypes from 'prop-types'
import React from 'react'
import RedBox from 'redbox-react'
import makeLogger from './utils/logging'

import isFunction from 'lodash/isFunction'

const __PROD__ = process.env.NODE_ENV === 'production'
const logger = makeLogger('error')

/* eslint-disable handle-callback-err */
const ProductionErrorHandler = ({ error }) => {
  return (
    <div className="error-panel">
      <div className="error-icon"><AlertWarning style={{ width: 48, height: 48 }} /></div>
      <div >An error happened while rendering this component.</div>
    </div>
  )
}
ProductionErrorHandler.propTypes = {
  error: PropTypes.any
}

const StackTraceErrorHandler =
  ({ error }) => <RedBox error={error} editorScheme="atm" />
StackTraceErrorHandler.propTypes = {
  error: PropTypes.any
}
/* eslint-enable handle-callback-err */

export const ErrorHandler = __PROD__ ? ProductionErrorHandler : StackTraceErrorHandler

/**
 * Converts an arbitrary error object into a string if it is not a string
 * already.
 *
 * @param {Object}  err  the error object to convert
 * @return {string} the error object converted into a string
 */
export function errorToString (err) {
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
export function handleError (err) {
  logger.error(errorToString(err))
}

export default handleError
