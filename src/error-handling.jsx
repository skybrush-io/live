/**
 * @file Module that provides generic error handler functions and
 * components that tie nicely into the main application.
 */

import isPromise from 'is-promise';
import isFunction from 'lodash-es/isFunction';
import PropTypes from 'prop-types';
import React from 'react';

import AlertWarning from '@material-ui/icons/Warning';

import makeLogger from './utils/logging';

const logger = makeLogger('error');

const reloadApp = () => {
  window.location.reload();
};

/**
 * Error handler component that can safely be used in production mode.
 */
const ProductionErrorHandler = ({ resetErrorBoundary }) => (
  <div className='error-panel'>
    <div className='error-icon'>
      <AlertWarning style={{ width: 48, height: 48 }} />
    </div>
    <div>An unexpected error happened. Sorry for the inconvenience.</div>
    <div className='email-link'>Please send us an email to let us know.</div>
    <div className='button-bar'>
      <button type='button' onClick={reloadApp}>
        Reload app
      </button>
      {resetErrorBoundary && (
        <button type='button' onClick={resetErrorBoundary}>
          Reset to factory defaults
        </button>
      )}
    </div>
  </div>
);

ProductionErrorHandler.propTypes = {
  resetErrorBoundary: PropTypes.func,
};

export const ErrorHandler = ProductionErrorHandler;

/**
 * Converts an arbitrary error object into a string if it is not a string
 * already.
 *
 * @param {Object}  err  the error object to convert
 * @param {string?}  prefix  a prefix string to attach in front of the error
 *        message, separated by a colon
 * @return {string} the error object converted into a string
 */
export function errorToString(error, prefix) {
  if (error.toString && isFunction(error.toString)) {
    return prefix ? `${prefix}: ${error.toString()}` : error.toString();
  } else {
    return prefix ? `${prefix}: ${String(error)}` : String(error);
  }
}

/**
 * Handles the given error object gracefully within the application.
 *
 * @param  {Error}   err  the error to handle
 * @param  {string}  operation  the operation we attempted to perform when the
 *         error happened, if known
 */
export function handleError(error, operation) {
  if (error && (error.isTimeout || error.hideStackTrace)) {
    const message =
      error.isTimeout && operation
        ? `${operation} timed out`
        : errorToString(error);

    logger.warn(message);
    console.warn(message);
  } else {
    const message = errorToString(error);

    logger.error(message);
    console.error(message);
  }
}

/**
 * Function decorator that takes a (possibly async) function and wraps it in a
 * handler that handles any errors thrown by the function.
 */
export function wrapInErrorHandler(func, operation) {
  return (...args) => {
    let result;
    try {
      result = func(...args);
    } catch (error) {
      handleError(error, operation);
    }

    if (isPromise(result)) {
      return result.catch((error) => handleError(error, operation));
    }
  };
}

export default handleError;
