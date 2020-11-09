/**
 * @file Module that provides generic error handler functions and
 * components that tie nicely into the main application.
 */

import AlertWarning from '@material-ui/icons/Warning';
import isPromise from 'is-promise';
import PropTypes from 'prop-types';
import React from 'react';
import RedBox from 'redbox-react';
import isFunction from 'lodash-es/isFunction';

import { MessageTimeout } from './flockwave/messages';
import makeLogger from './utils/logging';

const __PROD__ = process.env.NODE_ENV === 'production';
const logger = makeLogger('error');

const ProductionErrorHandler = () => (
  <div className='error-panel'>
    <div className='error-icon'>
      <AlertWarning style={{ width: 48, height: 48 }} />
    </div>
    <div>An unexpected error happened. Sorry for the inconvenience.</div>
    <div className='email-link'>Please send us an email to let us know.</div>
  </div>
);

const StackTraceErrorHandler = ({ error }) => (
  <RedBox error={error} editorScheme='atm' />
);
StackTraceErrorHandler.propTypes = {
  error: PropTypes.any.isRequired,
};

export const ErrorHandler = __PROD__
  ? ProductionErrorHandler
  : StackTraceErrorHandler;

/**
 * Converts an arbitrary error object into a string if it is not a string
 * already.
 *
 * @param {Object}  err  the error object to convert
 * @return {string} the error object converted into a string
 */
export function errorToString(err) {
  if (err.toString && isFunction(err.toString)) {
    return err.toString();
  }

  return String(err);
}

/**
 * Handles the given error object gracefully within the application.
 *
 * @param  {Error}   err  the error to handle
 * @param  {string}  operation  the operation we attempted to perform when the
 *         error happened, if known
 */
export function handleError(err, operation) {
  if (err instanceof MessageTimeout) {
    const message = operation ? `${operation} timed out` : errorToString(err);

    logger.warn(message);
    console.warn(message);
  } else {
    const message = errorToString(err);

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
