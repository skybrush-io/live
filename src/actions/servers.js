/**
 * @file Action factories related to the management of detected servers.
 */

import { createAction } from 'redux-actions';
import {
  CLOSE_AUTHENTICATION_DIALOG,
  CLOSE_DEAUTHENTICATION_DIALOG,
  SHOW_AUTHENTICATION_DIALOG,
  SHOW_DEAUTHENTICATION_DIALOG,
} from './types';

/**
 * Action factory that closes the authentication dialog and cancels the
 * current authentication attempt.
 */
export const closeAuthenticationDialog = createAction(
  CLOSE_AUTHENTICATION_DIALOG
);

/**
 * Action factory that closes the deauthentication dialog.
 */
export const closeDeauthenticationDialog = createAction(
  CLOSE_DEAUTHENTICATION_DIALOG
);

/**
 * Action factory that opens the authentication dialog.
 */
export const showAuthenticationDialog = createAction(
  SHOW_AUTHENTICATION_DIALOG
);

/**
 * Action factory that opens the deauthentication dialog.
 */
export const showDeauthenticationDialog = createAction(
  SHOW_DEAUTHENTICATION_DIALOG
);
