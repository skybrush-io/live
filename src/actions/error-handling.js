/**
 * @file Action factories related to error handling.
 */

import { createAction } from 'redux-actions';
import { CLOSE_ERROR_DIALOG, SHOW_ERROR_MESSAGE } from './types';

import { errorToString } from '~/error-handling';

/**
 * Action factory that creates an action that will hide the global error
 * dialog if it is open.
 */
export const closeErrorDialog = createAction(CLOSE_ERROR_DIALOG, () => null);

/**
 * Action factory that creates an action that will show the given error
 * message in the global error dialog.
 */
export const showErrorMessage = createAction(
  SHOW_ERROR_MESSAGE,
  (message, error) => {
    return error instanceof Error
      ? `${message}: ` + errorToString(error)
      : message;
  }
);
