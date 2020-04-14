/**
 * @file Slice of the state object that stores the list of currently detected
 * servers and whether we are authenticated to any of them.
 */

import { createSlice } from '@reduxjs/toolkit';

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
  valid: false,
};

/**
 * Helper function to handle the common parts of `addDetectedServer()` and
 * `addInferredServer()` in the action list.
 */
function addServer(state, { action, inferred }) {
  const { hostName, label, port, protocol } = action.payload;
  const type = inferred ? 'inferred' : 'detected';
  const key = `${hostName}:${port}:${type}:${protocol}`;
  const item = { id: key, hostName, label, port, protocol, type };

  action.key = key;

  if (state.detected.byId[key] === undefined) {
    // Server not seen yet; add it to the end
    action.wasAdded = true;
    state.detected.order.push(key);
  } else {
    action.wasAdded = false;
  }

  state.detected.byId[key] = item;
}

const url = new URL(window.location.href);
const token = url.searchParams ? url.searchParams.get('token') : undefined;

const { actions, reducer } = createSlice({
  name: 'servers',

  initialState: {
    current: {
      authentication: INVALID,
      features: {},
      state: ConnectionState.DISCONNECTED,
    },
    isAuthenticating: false,
    isScanning: false,
    detected: {
      byId: {},
      order: [],
    },
    token,
  },

  reducers: {
    /**
     * Adds a detected server to the list of detected servers in the server
     * registry.
     *
     * The action will receive a property named `key` when the addition is
     * completed; this will contain an opaque identifier that can be used later
     * in other actions to refer to the entry that was just created.
     */
    addDetectedServer(state, action) {
      addServer(state, { action, inferred: false });
    },

    /**
     * Adds a server whose settings were inferred in the absence of a reliable
     * detection mechanism (such as SSDP) to the list of detected servers in
     * the server registry.
     *
     * The action will receive a property named `key` when the addition is
     * completed; this will contain an opaque identifier that can be used later
     * in other actions to refer to the entry that was just created.
     */
    addInferredServer(state, action) {
      addServer(state, { action, inferred: true });
    },

    /**
     * Adds a new feature to the list of features supported by the server.
     */
    addServerFeature(state, action) {
      let { payload } = action;

      if (typeof payload !== 'object') {
        payload = { name: String(payload), data: true };
      }

      const { name, data } = payload;
      state.current.features[name] = data;
    },

    authenticateToServerPromisePending(state) {
      state.isAuthenticating = true;
    },

    authenticateToServerPromiseFulfilled(state) {
      state.isAuthenticating = false;
    },

    authenticateToServerPromiseRejected(state) {
      state.isAuthenticating = false;
    },

    /**
     * Clears the name and domain of the currently authenticated user.
     */
    clearAuthenticatedUser(state) {
      state.current.authentication.user = '';
    },

    /**
     * Clears the stored authentication token.
     */
    clearAuthenticationToken(state) {
      state.token = undefined;
    },

    /**
     * Clears the list of features that we know are supported on the server that
     * we are connected to.
     */
    clearServerFeatures(state) {
      state.current.features = {};
    },

    /**
     * Action factory that creates an action that removes all the previously
     * detected servers from the server registry.
     */
    removeAllDetectedServers(state) {
      state.detected = {
        byId: {},
        order: [],
      };
    },

    /**
     * Action factory that sets the name and domain of the currently authenticated
     * user.
     */
    setAuthenticatedUser(state, action) {
      state.current.authentication.user = action.payload || '';
    },

    /**
     * Action factory that creates an action that sets whether we are connected
     * to the current server that the user is trying to communicate with or not.
     */
    setCurrentServerConnectionState(state, action) {
      const newState = action.payload;

      state.current.state = newState;

      // If we have disconnected just now, clear the authentication
      // information as we don't know yet what the server provides
      if (newState === ConnectionState.DISCONNECTED) {
        state.current.authentication = INVALID;
      }
    },

    /**
     * Action factory that creates an action that notifies the store that the
     * scanning for servers has started.
     */
    startScanning(state) {
      state.isScanning = true;
    },

    /**
     * Action factory that creates an action that notifies the store that the
     * scanning for servers has stopped.
     */
    stopScanning(state) {
      state.isScanning = false;
    },

    /**
     * Updates the authentication settings known about the current server.
     */
    updateCurrentServerAuthenticationSettings(state, action) {
      const { methods, required, user } = action.payload;

      if (!Array.isArray(methods)) {
        return;
      }

      state.current.authentication.required = Boolean(required);
      state.current.authentication.methods = methods.map((x) => String(x));
      if (user !== undefined) {
        state.current.authentication.user = user;
      }

      state.current.authentication.valid = true;
    },

    /**
     * Updates the hostname of a server, used as a fallback when no
     * label is available for the server.
     */
    updateDetectedServerHostname(state, action) {
      const { key, hostName } = action.payload;
      if (state.detected.byId[key] !== undefined) {
        // Server is still there, update the name
        state.detected.byId[key].hostName = hostName;
      }
    },

    /**
     * Updates the displayed label of a server.
     */
    updateDetectedServerLabel(state, action) {
      const { key, label } = action.payload;
      if (state.detected.byId[key] !== undefined) {
        // Server is still there, update the name
        state.detected.byId[key].label = label;
      }
    },
  },
});

export const {
  addDetectedServer,
  addInferredServer,
  addServerFeature,
  authenticateToServerPromiseFulfilled,
  authenticateToServerPromisePending,
  authenticateToServerPromiseRejected,
  clearAuthenticatedUser,
  clearAuthenticationToken,
  clearServerFeatures,
  removeAllDetectedServers,
  setAuthenticatedUser,
  setCurrentServerConnectionState,
  startScanning,
  stopScanning,
  updateCurrentServerAuthenticationSettings,
  updateDetectedServerHostname,
  updateDetectedServerLabel,
} = actions;

export default reducer;
