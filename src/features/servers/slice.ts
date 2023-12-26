/**
 * @file Slice of the state object that stores the list of currently detected
 * servers and whether we are authenticated to any of them.
 */

import {
  type License,
  type Response_AUTHINF,
  type Response_AUTHWHOAMI,
} from 'flockwave-spec';
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { type ReadonlyDeep } from 'type-fest';

import { ConnectionState } from '~/model/enums';
import { getAuthenticationTokenFromUrl } from '~/utils/authentication';
import {
  clearOrderedCollection,
  type Collection,
  EMPTY_COLLECTION,
} from '~/utils/collections';
import { noPayload } from '~/utils/redux';

import {
  type ServerAuthenticationInformation,
  type ServerParameters,
} from './types';
import { addServer } from './utils';

export type ServersSliceState = ReadonlyDeep<{
  current: {
    authentication: ServerAuthenticationInformation;
    features: Record<string, boolean>;
    license?: License;
    state: ConnectionState;
    timeSync: {
      adjusting?: boolean;
      adjustmentResult?: boolean;
      calculating?: boolean;
      clockSkew?: number;
      roundTripTime?: number;
    };
    version?: string;
  };
  isAuthenticating: boolean;
  isScanning: boolean;
  detected: Collection<ServerParameters>;
  token?: string;
  timeSyncDialog: {
    open: boolean;
  };
}>;

/**
 * Part of the default state object that represents a connection where the
 * information about the authentication requirements of the server is
 * not available yet.
 */
export const INVALID: ServerAuthenticationInformation = {
  methods: [],
  required: false,
  user: '',
  valid: false,
};

const initialState: ServersSliceState = {
  current: {
    authentication: INVALID,
    features: {},
    license: undefined,
    state: ConnectionState.DISCONNECTED,
    timeSync: {
      adjusting: false,
      adjustmentResult: undefined,
      calculating: false,
      clockSkew: undefined,
      roundTripTime: undefined,
    },
    version: undefined,
  },
  isAuthenticating: false,
  isScanning: false,
  detected: EMPTY_COLLECTION,
  token: getAuthenticationTokenFromUrl(),
  timeSyncDialog: {
    open: false,
  },
};

const { actions, reducer } = createSlice({
  name: 'servers',
  initialState,
  reducers: {
    /**
     * Adds a detected server to the list of detected servers in the server
     * registry.
     *
     * The action will receive a property named `key` when the addition is
     * completed; this will contain an opaque identifier that can be used later
     * in other actions to refer to the entry that was just created.
     */
    addDetectedServer(
      state,
      action: PayloadAction<Omit<ServerParameters, 'id' | 'type'>>
    ) {
      addServer(state, 'detected', action);
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
    addInferredServer(
      state,
      action: PayloadAction<Omit<ServerParameters, 'id' | 'type'>>
    ) {
      addServer(state, 'inferred', action);
    },

    /**
     * Adds one or more new features to the list of features supported by the server.
     */
    addServerFeatures(
      state,
      action: PayloadAction<Array<string | { name: string; data: boolean }>>
    ) {
      let { payload } = action;

      if (!Array.isArray(payload)) {
        payload = [payload];
      }

      for (let item of payload) {
        if (typeof item !== 'object') {
          item = { name: String(item), data: true };
        }

        const { name, data } = item;
        state.current.features[name] = data;
      }
    },

    /**
     * Notifies the state store that we have started adjusting the time on the
     * server.
     */
    adjustServerTimePromisePending(state) {
      state.current.timeSync.adjusting = true;
      state.current.timeSync.adjustmentResult = undefined;
    },

    /**
     * Notifies the state store that we have finished adjusting the time on the
     * server successfully.
     */
    adjustServerTimePromiseFulfilled(state) {
      state.current.timeSync.adjusting = false;
      state.current.timeSync.adjustmentResult = true;
    },

    /**
     * Notifies the state store that we have finished adjusting the time on the
     * server and the attempt failed.
     */
    adjustServerTimePromiseRejected(state) {
      state.current.timeSync.adjusting = false;
      state.current.timeSync.adjustmentResult = false;
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
     * Clears the information about the currently active license on the server.
     */
    clearServerLicense(state) {
      state.current.license = undefined;
    },

    /**
     * Clears the time synchronization related statistics of the current server.
     */
    clearTimeSyncStatistics(state) {
      state.current.timeSync = {
        clockSkew: undefined,
        roundTripTime: undefined,
      };
    },

    /**
     * Notifies the state store that we have started calculating the clock skew
     * between the client and the server.
     */
    calculateClockSkewPromisePending(state) {
      state.current.timeSync.calculating = true;
    },

    /**
     * Notifies the state store that we have finished calculating the clock skew
     * between the client and the server and that we have a result.
     */
    calculateClockSkewPromiseFulfilled(
      state,
      action: PayloadAction<{ clockSkew?: number; roundTripTime?: number }>
    ) {
      state.current.timeSync.calculating = false;

      const { clockSkew, roundTripTime } = action.payload;
      state.current.timeSync.clockSkew =
        typeof clockSkew === 'number' && Number.isFinite(clockSkew)
          ? clockSkew
          : undefined;
      state.current.timeSync.roundTripTime =
        typeof roundTripTime === 'number' && Number.isFinite(roundTripTime)
          ? roundTripTime
          : undefined;
    },

    /**
     * Notifies the state store that we have finished calculating the clock skew
     * between the client and the server and the process terminated with an error.
     */
    calculateClockSkewPromiseRejected(state) {
      state.current.timeSync.calculating = false;
    },

    /**
     * Closes the server-client time synchronization dialog.
     */
    closeTimeSyncWarningDialog: noPayload<ServersSliceState>((state) => {
      state.timeSyncDialog.open = false;
    }),

    /**
     * Opens the server-client time synchronization dialog.
     */
    openTimeSyncWarningDialog: noPayload<ServersSliceState>((state) => {
      state.timeSyncDialog.open = true;
    }),

    /**
     * Action factory that creates an action that removes all the previously
     * detected servers from the server registry.
     */
    removeAllDetectedServers(state) {
      clearOrderedCollection(state.detected);
    },

    /**
     * Action factory that sets the name and domain of the currently authenticated
     * user.
     */
    setAuthenticatedUser(state, action: PayloadAction<string | undefined>) {
      state.current.authentication.user = action.payload ?? '';
    },

    /**
     * Action factory that creates an action that sets whether we are connected
     * to the current server that the user is trying to communicate with or not.
     */
    setCurrentServerConnectionState(
      state,
      action: PayloadAction<ConnectionState>
    ) {
      const newState = action.payload;

      state.current.state = newState;

      // If we have disconnected just now, clear the authentication
      // information as we don't know yet what the server provides
      if (newState === ConnectionState.DISCONNECTED) {
        state.current.authentication = INVALID;
      }
    },

    /**
     * Sets the information about the currently active license on the server.
     */
    setServerLicense(state, { payload: license }: PayloadAction<License>) {
      state.current.license = license;
    },

    /**
     * Sets version information about the currently active server.
     */
    setServerVersion(state, { payload: version }: PayloadAction<string>) {
      state.current.version = version;
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
    updateCurrentServerAuthenticationSettings(
      state,
      action: PayloadAction<
        Pick<Response_AUTHINF, 'methods' | 'required'> &
          Pick<Response_AUTHWHOAMI, 'user'>
      >
    ) {
      const { methods, required, user } = action.payload;

      if (!Array.isArray(methods)) {
        return;
      }

      state.current.authentication.required = Boolean(required);
      state.current.authentication.methods = methods.map(String);
      if (user !== undefined) {
        state.current.authentication.user = user;
      }

      state.current.authentication.valid = true;
    },

    /**
     * Updates the hostname of a server, used as a fallback when no
     * label is available for the server.
     */
    updateDetectedServerHostname(
      state,
      action: PayloadAction<{
        key: ServerParameters['id'];
        hostName: ServerParameters['hostName'];
      }>
    ) {
      const { key, hostName } = action.payload;
      const server = state.detected.byId[key];
      if (server) {
        // Server is still there, update the name
        server.hostName = hostName;
      }
    },

    /**
     * Updates the displayed label of a server.
     */
    updateDetectedServerLabel(
      state,
      action: PayloadAction<{
        key: ServerParameters['id'];
        label: ServerParameters['label'];
      }>
    ) {
      const { key, label } = action.payload;
      const server = state.detected.byId[key];
      if (server) {
        // Server is still there, update the name
        server.label = label;
      }
    },
  },
});

export const {
  addDetectedServer,
  addInferredServer,
  addServerFeatures,
  authenticateToServerPromiseFulfilled,
  authenticateToServerPromisePending,
  authenticateToServerPromiseRejected,
  clearAuthenticatedUser,
  clearAuthenticationToken,
  clearServerFeatures,
  clearServerLicense,
  clearTimeSyncStatistics,
  closeTimeSyncWarningDialog,
  openTimeSyncWarningDialog,
  removeAllDetectedServers,
  setAuthenticatedUser,
  setCurrentServerConnectionState,
  setServerLicense,
  setServerVersion,
  startScanning,
  stopScanning,
  updateCurrentServerAuthenticationSettings,
  updateDetectedServerHostname,
  updateDetectedServerLabel,
} = actions;

export default reducer;
