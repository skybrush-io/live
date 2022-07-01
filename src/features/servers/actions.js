import { Base64 } from 'js-base64';
import isNil from 'lodash-es/isNil';
import pTimeout from 'p-timeout';

import { errorToString, wrapInErrorHandler } from '~/error-handling';
import {
  adjustServerTimeToMatchLocalTime as adjustServerTimeToMatchLocalTime_,
  estimateClockSkewAndRoundTripTime,
} from '~/flockwave/timesync';
import { createAsyncAction } from '~/utils/redux';

import { actions as authenticationDialogActions } from './authentication-dialog';
import { actions as deauthenticationDialogActions } from './deauthentication-dialog';
import { actions as serverSettingsDialogActions } from './server-settings-dialog';
import { getClockSkewInMilliseconds } from './selectors';

export const {
  closeServerSettingsDialog,
  disconnectFromServer,
  setServerSettingsDialogTab,
  showServerSettingsDialog,
  updateServerSettings,
} = serverSettingsDialogActions;

export const { closeAuthenticationDialog, showAuthenticationDialog } =
  authenticationDialogActions;

export const { closeDeauthenticationDialog, showDeauthenticationDialog } =
  deauthenticationDialogActions;

/**
 * Action factory that creates an action that starts an authentication attempt.
 *
 * The action factory must be invoked with an object with three keys:
 * `messageHub, ``method` and `data`, where `method` is the authentication
 * method to use, `data` is the authentication data to submit, and
 * `messageHub` is the message hub used to dispatch messages to the hserver.
 */
export const authenticateToServer = createAsyncAction(
  'servers/authenticateToServer',
  async ({ method, data, messageHub }) => {
    try {
      const { body } = await messageHub.sendMessage({
        type: 'AUTH-REQ',
        method,
        data,
      });

      if (body.type === 'AUTH-RESP') {
        if (body.data) {
          throw new Error('Multi-step authentication not supported');
        } else if (body.result) {
          return {
            result: true,
            user: body.user,
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
        reason,
      };
    }
  }
);

/**
 * Action factory that creates an action that submits the data from the
 * authentication dialog and starts a basic authentication attempt.
 *
 * The action factory must be invoked with an object with three keys:
 * `messageHub, ``username` and `password`.
 */
export function authenticateToServerWithBasicAuthentication({
  username,
  password,
  messageHub,
}) {
  return authenticateToServer({
    method: 'basic',
    data: Base64.encode(`${username}:${password}`),
    messageHub,
  });
}

/**
 * Calculates the clock skew and round-trip time to the server, and stores the
 * result in the Redux store.
 *
 * @param {string} method  the method to use for the calculation; one of
 *        `simple`, `threshold` and `accurate`. `simple` sends a single SYS-TIME
 *        message to the server, estimates the clock skew and the round-trip
 *        time from that single message and stores the result in the state store.
 *        `threshold` repeats the measurement until the round-trip time falls
 *        under a reasonable threshold or until a given number of tries is
 *        exceeded, whichever happens first. `accurate` repeats the measurement
 *        ten times, averages the round-trip times, throwing away the largest
 *        two (probably outliers), and calculates the clock skew from the three
 *        responses with the fastest round-trip times.
 */
export const calculateAndStoreClockSkew = createAsyncAction(
  'servers/calculateClockSkew',
  estimateClockSkewAndRoundTripTime
);

export const calculateAndStoreClockSkewWithMinDelay = createAsyncAction(
  'servers/calculateClockSkew',
  estimateClockSkewAndRoundTripTime,
  { minDelay: 1000 }
);

const adjustServerTimeToMatchLocalTimeWithKnownDelay = createAsyncAction(
  'servers/adjustServerTime',
  adjustServerTimeToMatchLocalTime_,
  { minDelay: 1000 }
);

export const adjustServerTimeToMatchLocalTime = (messageHub) =>
  wrapInErrorHandler((dispatch, getState) => {
    const clockSkew = getClockSkewInMilliseconds(getState());

    if (isNil(clockSkew)) {
      throw new Error('Clock skew between server and client is not known');
    }

    dispatch(
      adjustServerTimeToMatchLocalTimeWithKnownDelay(messageHub, clockSkew)
    );

    dispatch(calculateAndStoreClockSkew(messageHub, { method: 'accurate' }));
  });
