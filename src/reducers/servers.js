/**
 * @file Reducer function for handling the part of the state object that
 * stores the detected servers in the local network.
 *
 * This feature works only from the Electron desktop app. The browser-based
 * version will attempt to make an educated guess based on the server URL.
 */

import { handleActions } from 'redux-actions';
import u from 'updeep';

import { ConnectionState } from '~/model/connections';

/**
 * Part of the default state object that represents a connection where the
 * information about the authentication requirements of the server is
 * not available yet.
 */
export const INVALID = {
  methods: [],
  required: false,
  user: '',
  valid: false
};

/**
 * Default content of the list of detected servers in the state object.
 */
const defaultState = {
  current: {
    authentication: INVALID,
    state: ConnectionState.DISCONNECTED
  },
  isAuthenticating: false,
  isScanning: false,
  detected: {
    byId: {},
    order: []
  }
};

/**
 * The reducer function that handles actions related to the list of detected
 * servers on the local network.
 */
const reducer = handleActions(
  {
    ADD_DETECTED_SERVER: (state, action) => {
      const { hostName, port, protocol, type } = action.payload;
      const key = `${hostName}:${port}:${type}:${protocol}`;
      const item = {
        [key]: { id: key, hostName, port, protocol, type }
      };

      action.key = key;
      action.wasAdded = false;

      if (state.detected.byId[key] !== undefined) {
        // Server already seen; just replace it
        return u({ detected: u({ byId: item }) }, state);
      }

      // Server not seen yet; add it to the end
      action.wasAdded = true;
      return u(
        {
          detected: u({
            byId: item,
            order: [...state.detected.order, key]
          })
        },
        state
      );
    },

    REMOVE_ALL_DETECTED_SERVERS: state =>
      u(
        {
          detected: u.constant({
            byId: {},
            order: []
          })
        },
        state
      ),

    SET_AUTHENTICATED_USER: (state, action) =>
      u(
        {
          current: {
            authentication: {
              user: String(action.payload || '')
            }
          }
        },
        state
      ),

    SET_CURRENT_SERVER_CONNECTION_STATE: (state, action) => {
      const updates = { state: action.payload };

      // If we have connected or disconnected just now, clear the authentication
      // information as we don't know yet what the server provides
      if (updates.state === ConnectionState.DISCONNECTED) {
        updates.authentication = u.constant(INVALID);
      }

      return u({ current: u(updates) }, state);
    },

    START_SCANNING: state => u({ isScanning: true }, state),

    STOP_SCANNING: state => u({ isScanning: true }, state),

    AUTHENTICATE_TO_SERVER_PENDING: state =>
      u({ isAuthenticating: true }, state),
    AUTHENTICATE_TO_SERVER_FULFILLED: state =>
      u({ isAuthenticating: false }, state),
    AUTHENTICATE_TO_SERVER_REJECTED: state =>
      u({ isAuthenticating: false }, state),

    UPDATE_CURRENT_SERVER_AUTHENTICATION_SETTINGS: (state, action) => {
      const { methods, required, user } = action.payload;

      if (!Array.isArray(methods)) {
        return state;
      }

      return u(
        {
          current: u({
            authentication: u({
              required: Boolean(required),
              methods: methods.map(x => String(x)),
              user:
                user === undefined ? state.current.authentication.user : user,
              valid: true
            })
          })
        },
        state
      );
    },

    UPDATE_DETECTED_SERVER_LABEL: (state, action) => {
      const { key, label } = action.payload;
      const item = { [key]: { label } };
      if (state.detected.byId[key] !== undefined) {
        // Server is still there, update the name
        return u({ detected: u({ byId: item }) }, state);
      }

      // Server was removed, don't do anything
      return state;
    }
  },
  defaultState
);

export default reducer;
