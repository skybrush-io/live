import { Base64 } from 'js-base64';
import pTimeout from 'p-timeout';

import { errorToString } from '~/error-handling';
import { createAsyncAction } from '~/utils/redux';

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
        data
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
 * Action factory that creates an action that submits the data from the
 * authentication dialog and starts a basic authentication attempt.
 *
 * The action factory must be invoked with an object with three keys:
 * `messageHub, ``username` and `password`.
 */
export function authenticateToServerWithBasicAuthentication({
  username,
  password,
  messageHub
}) {
  return authenticateToServer({
    method: 'basic',
    data: Base64.encode(`${username}:${password}`),
    messageHub
  });
}
