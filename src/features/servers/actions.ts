import { Base64 } from 'js-base64';
import isNil from 'lodash-es/isNil';
import { TimeoutError } from 'p-timeout';

import type {
  Response_AUTHRESP_MultiStep,
  Response_AUTHRESP_SingleStep,
} from '@skybrush/flockwave-spec';

import { errorToString, wrapInErrorHandler } from '~/error-handling';
import type MessageHub from '~/flockwave/messages';
import {
  adjustServerTimeToMatchLocalTime as adjustServerTimeToMatchLocalTime_,
  estimateClockSkewAndRoundTripTime,
} from '~/flockwave/timesync';
import type { AppDispatch, RootState } from '~/store/reducers';
import { createAsyncAction } from '~/utils/redux';

import { actions as authenticationDialogActions } from './authentication-dialog';
import { actions as deauthenticationDialogActions } from './deauthentication-dialog';
import { getClockSkewInMilliseconds } from './selectors';
import { actions as serverSettingsDialogActions } from './server-settings-dialog';

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

type AuthResponseBody =
  | Response_AUTHRESP_SingleStep
  | Response_AUTHRESP_MultiStep
  | { type: string; reason?: unknown };

type AuthenticationResult = {
  result: boolean;
  user?: string;
  reason?: string;
};

type AuthenticateParams = {
  method: string;
  data: string;
  messageHub: MessageHub;
};

/**
 * Action factory that creates an action that starts an authentication attempt.
 *
 * The action factory must be invoked with an object with three keys:
 * `messageHub`, `method` and `data`, where `method` is the authentication
 * method to use, `data` is the authentication data to submit, and
 * `messageHub` is the message hub used to dispatch messages to the server.
 */
export const authenticateToServer = createAsyncAction(
  'servers/authenticateToServer',
  async ({
    method,
    data,
    messageHub,
  }: AuthenticateParams): Promise<AuthenticationResult> => {
    try {
      const { body } = await messageHub.sendMessage<AuthResponseBody>({
        type: 'AUTH-REQ',
        method,
        data,
      });

      if (body.type === 'AUTH-RESP') {
        if ('data' in body) {
          throw new Error('Multi-step authentication not supported');
        } else if ('result' in body) {
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
          // Need casting, TS can't properly narrow down the type,
          // and we don't know the actualy response shape anyway.
          String((body as { reason?: unknown }).reason) ||
            'Unexpected message received from server'
        );
      }
    } catch (error) {
      let reason: string;

      if (error instanceof TimeoutError) {
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

type BasicAuthParams = {
  username: string;
  password: string;
  messageHub: MessageHub;
};

/**
 * Action factory that creates an action that submits the data from the
 * authentication dialog and starts a basic authentication attempt.
 *
 * The action factory must be invoked with an object with three keys:
 * `messageHub`, `username` and `password`.
 */
export function authenticateToServerWithBasicAuthentication({
  username,
  password,
  messageHub,
}: BasicAuthParams) {
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
 * @param method  the method to use for the calculation; one of
 *        `single`, `threshold` and `accurate`. `single` sends a single SYS-TIME
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

export const adjustServerTimeToMatchLocalTime = (messageHub: MessageHub) =>
  wrapInErrorHandler((dispatch: AppDispatch, getState: () => RootState) => {
    const clockSkew = getClockSkewInMilliseconds(getState());

    if (isNil(clockSkew)) {
      throw new Error('Clock skew between server and client is not known');
    }

    dispatch(
      adjustServerTimeToMatchLocalTimeWithKnownDelay(messageHub, clockSkew)
    );

    dispatch(calculateAndStoreClockSkew(messageHub, { method: 'accurate' }));
  });
