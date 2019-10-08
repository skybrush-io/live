/**
 * @file Reducer function that is responsible for managing the part of the
 * state object that stores the state of the local server that is to be
 * launched on-demand when the user does not want to connect to a remote
 * server.
 */

import { handleActions } from 'redux-actions';
import u from 'updeep';

/**
 * Default content of the event log registry in the state object.
 */
const defaultState = {
  pathScan: {
    scanning: false,
    result: undefined,
    error: undefined
  },
  running: false
};

/**
 * The reducer function that handles actions related to the handling of
 * the local server.
 */
const reducer = handleActions(
  {
    LOCAL_SERVER_EXECUTABLE_SEARCH_RESULT: (state, action) => {
      const { payload } = action;
      if (payload.error !== undefined) {
        return u(
          {
            pathScan: {
              scanning: false,
              result: undefined,
              error: payload.error
            }
          },
          state
        );
      }

      if (payload.result !== undefined) {
        return u(
          {
            pathScan: {
              scanning: false,
              result: payload.result,
              error: undefined
            }
          },
          state
        );
      }

      if (payload.scanning) {
        return u(
          {
            pathScan: {
              scanning: true,
              result: undefined,
              error: undefined
            }
          },
          state
        );
      }

      return state;
    },

    START_LOCAL_SERVER_EXECUTABLE_SEARCH: state =>
      u(
        {
          // Clearing both the result and the error of the pathScan part of
          // the state object will trigger the appropriate Redux saga to
          // start the scanning again
          pathScan: {
            result: undefined,
            error: undefined
          }
        },
        state
      )
  },
  defaultState
);

export default reducer;
