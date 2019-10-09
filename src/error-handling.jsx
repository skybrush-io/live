/**
 * @file Module that provides generic error handler functions and
 * components that tie nicely into the main application.
 */

import AlertWarning from '@material-ui/icons/Warning';
import PropTypes from 'prop-types';
import React from 'react';
import RedBox from 'redbox-react';
import isFunction from 'lodash/isFunction';
import makeLogger from './utils/logging';

const __PROD__ = process.env.NODE_ENV === 'production';
const logger = makeLogger('error');

const ProductionErrorHandler = () => {
  return (
    <div className="error-panel">
      <div className="error-icon">
        <AlertWarning style={{ width: 48, height: 48 }} />
      </div>
      <div>An error happened while rendering this component.</div>
    </div>
  );
};

const StackTraceErrorHandler = ({ error }) => (
  <RedBox error={error} editorScheme="atm" />
);
StackTraceErrorHandler.propTypes = {
  error: PropTypes.any.isRequired
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
 * @param  {Error}  err  the error to handle
 */
export function handleError(err) {
  logger.error(errorToString(err));
}

export default handleError;
