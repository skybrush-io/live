/**
 * @file Module that provides generic error handler functions and
 * components that tie nicely into the main application.
 */

import isPromise from 'is-promise';

import AlertWarning from '@mui/icons-material/Warning';

import {
  showError,
  showWarning,
} from '~/features/snackbar/actions';
import makeLogger from '~/utils/logging';

const logger = makeLogger('error');

const reloadApp = () => {
  window.location.reload();
};

type ProductionErrorHandlerProps = {
  resetErrorBoundary?: () => void;
};

/**
 * Error handler component that can safely be used in production mode.
 */
const ProductionErrorHandler = ({
  resetErrorBoundary,
}: ProductionErrorHandlerProps) => (
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

export const ErrorHandler = ProductionErrorHandler;

/**
 * Converts an arbitrary error object into a string if it is not a string
 * already.
 *
 * @param err    the error object to convert
 * @param prefix  a prefix string to attach in front of the error
 *        message, separated by a colon
 * @return  the error object converted into a string
 */
export function errorToString(error: unknown, prefix?: string): string {
  if (error === null || error === undefined || typeof error !== 'object') {
    return prefix ? `${prefix}: ${String(error)}` : String(error);
  }

  if ('toString' in error) {
    // eslint-disable-next-line @typescript-eslint/no-base-to-string
    return prefix ? `${prefix}: ${error.toString()}` : error.toString();
  }

  return prefix ? `${prefix}: ${String(error)}` : String(error);
}

/**
 * Handles the given error object gracefully within the application.
 *
 * @param err  the error to handle
 * @param operation  the operation we attempted to perform when the
 *         error happened, if known
 */
export function handleError(error: unknown, operation?: string) {
  if (typeof error !== 'object') {
    const message = errorToString(error);

    logger.error(message);
    console.error(message);
    showError(message, operation ? { topic: operation } : undefined);
    return;
  }

  if (error) {
    if ('isTimeout' in error) {
      const message =
        error.isTimeout && operation
          ? `${operation} timed out`
          : errorToString(error);

      logger.warn(message);
      console.warn(message);
      showWarning(message, operation ? { topic: operation } : undefined);

      return;
    }

    if ('hideStackTrace' in error) {
      const message = errorToString(error);

      logger.warn(message);
      console.warn(message);
      showWarning(message, operation ? { topic: operation } : undefined);
      return;
    }
  }

  const message = errorToString(error);

  logger.error(message);
  console.error(message);
  showError(message, operation ? { topic: operation } : undefined);
}

/**
 * Function decorator that takes a (possibly async) function and wraps it in a
 * handler that handles any errors thrown by the function.
 *
 * @param func  the function to wrap
 * @param operation  the operation we are attempting to perform when calling
 *        the function, if known
 * @return  a new function that behaves the same as the original function but
 *          handles any errors thrown by it gracefully. The return type of the
 *          function is extended with `undefined` to cater for the case when the
 *          function throws an exception that is handled gracefully - in this case,
 *          we have no result to return.
 */
export function wrapInErrorHandler<T extends any[], U>(
  func: (...args: T) => Promise<U>,
  operation?: string
): (...args: T) => Promise<U | undefined>;
export function wrapInErrorHandler<T extends any[], U>(
  func: (...args: T) => U,
  operation?: string
): (...args: T) => U | undefined;
export function wrapInErrorHandler<T extends any[], U>(
  func: (...args: T) => U,
  operation?: string
): (...args: T) => Promise<U | undefined> | U | undefined {
  return (...args) => {
    let result: U;
    try {
      result = func(...args);
    } catch (error) {
      handleError(error, operation);
      return;
    }

    if (!isPromise(result)) {
      return result;
    }

    return (result as any as Promise<U>).catch((error: unknown) => {
      handleError(error, operation);
      return undefined;
    });
  };
}

export default handleError;
