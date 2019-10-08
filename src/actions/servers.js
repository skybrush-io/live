/**
 * @file Action factories related to the management of detected servers.
 */

import { Base64 } from 'js-base64';
import pTimeout from 'p-timeout';
import { createAction } from 'redux-actions';
import {
  ADD_DETECTED_SERVER,
  AUTHENTICATE_TO_SERVER,
  CLOSE_AUTHENTICATION_DIALOG,
  CLOSE_DEAUTHENTICATION_DIALOG,
  REMOVE_ALL_DETECTED_SERVERS,
  SET_AUTHENTICATED_USER,
  SET_CURRENT_SERVER_CONNECTION_STATE,
  SHOW_AUTHENTICATION_DIALOG,
  SHOW_DEAUTHENTICATION_DIALOG,
  START_SCANNING,
  STOP_SCANNING,
  UPDATE_CURRENT_SERVER_AUTHENTICATION_SETTINGS,
  UPDATE_DETECTED_SERVER_LABEL
} from './types';

import { errorToString } from '~/error-handling';

/**
 * Action factory that creates an action that adds a detected server to the
 * list of detected servers in the server registry.
 *
 * The action will receive a property named `key` when the addition is
 * completed; this will contain an opaque identifier that can be used later
 * in other actions to refer to the entry that was just created.
 */
export const addDetectedServer = createAction(
  ADD_DETECTED_SERVER,
  (hostName, port, protocol) => ({ hostName, port, protocol, type: 'detected' })
);

/**
 * Action factory that creates an action that adds a server whose settings
 * were inferred in the absence of a reliable detection mechanism (such as
 * SSDP) to the list of detected servers in the server registry.
 *
 * The action will receive a property named `key` when the addition is
 * completed; this will contain an opaque identifier that can be used later
 * in other actions to refer to the entry that was just created.
 */
export const addInferredServer = createAction(
  ADD_DETECTED_SERVER,
  (hostName, port, protocol) => ({ hostName, port, protocol, type: 'inferred' })
);

/**
 * Action factory that creates an action that submits the data from the
 * authentication dialog and starts an authentication attempt.
 *
 * The action factory must be invoked with an object with three keys:
 * `messageHub, ``username` and `password`.
 */
export const authenticateToServer = createAction(
  AUTHENTICATE_TO_SERVER,
  async ({ username, password, messageHub }) => {
    try {
      const { body } = await messageHub.sendMessage({
        type: 'AUTH-REQ',
        method: 'basic',
        data: Base64.encode(`${username}:${password}`)
      });

      if (body.type === 'AUTH-RESP') {
        if (body.data) {
          throw new Error('Multi-step authentication not supported');
        } else if (body.result) {
          return {
            result: true,
            user: body.user
          };
        } else {
          throw new Error(String(body.reason) || 'Authentication failed');
        }
      } else {
        console.warn(`Expected AUTH-RESP, got ${body.type}`);
        throw new Error(
          String(body.reason) || 'Unexpected message received from server'
        );
      }
    } catch (error) {
      let reason;

      if (error instanceof pTimeout.TimeoutError) {
        reason = 'Authentication timeout; try again later';
      } else {
        reason = errorToString(error);
      }

      return {
        result: false,
        reason
      };
    }
  }
);

/**
 * Action factory that clears the name and domain of the currently authenticated
 * user.
 */
export const clearAuthenticatedUser = createAction(
  SET_AUTHENTICATED_USER,
  () => undefined
);

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
 * Action factory that creates an action that removes all the previously
 * detected servers from the server registry.
 */
export const removeAllDetectedServers = createAction(
  REMOVE_ALL_DETECTED_SERVERS
);

/**
 * Action factory that sets the name and domain of the currently authenticated
 * user.
 */
export const setAuthenticatedUser = createAction(SET_AUTHENTICATED_USER);

/**
 * Action factory that creates an action that sets whether we are connected
 * to the current server that the user is trying to communicate with or not.
 */
export const setCurrentServerConnectionState = createAction(
  SET_CURRENT_SERVER_CONNECTION_STATE
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

/**
 * Action factory that creates an action that notifies the store that the
 * scanning for servers has started.
 */
export const startScanning = createAction(START_SCANNING);

/**
 * Action factory that creates an action that notifies the store that the
 * scanning for servers has stopped.
 */
export const stopScanning = createAction(STOP_SCANNING);

/**
 * Updates the displayed label of a detected server.
 */
export const updateDetectedServerLabel = createAction(
  UPDATE_DETECTED_SERVER_LABEL,
  (key, label) => ({ key, label })
);

/**
 * Updates the authentication settings known about the current server.
 */
export const updateCurrentServerAuthenticationSettings = createAction(
  UPDATE_CURRENT_SERVER_AUTHENTICATION_SETTINGS
);
