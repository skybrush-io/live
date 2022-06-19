/**
 * @file Slice of the state object that stores the settings of the current drone
 * show being executed.
 */

import getUnixTime from 'date-fns/getUnixTime';
import isNil from 'lodash-es/isNil';
import set from 'lodash-es/set';

import { createSlice } from '@reduxjs/toolkit';

import {
  COORDINATE_SYSTEM_TYPE,
  DEFAULT_ALTITUDE_REFERENCE,
  DEFAULT_ROOM_SIZE,
} from './constants';
import { StartMethod } from './enums';

import { noPayload } from '~/utils/redux';

const { actions, reducer } = createSlice({
  name: 'show',

  initialState: {
    data: null,

    loading: false,
    progress: 0,

    sourceUrl: null,
    changedSinceLoaded: false,
    lastLoadAttemptFailed: false,

    environment: {
      editing: false,
      outdoor: {
        coordinateSystem: {
          orientation: '0', // stored as a string to avoid rounding errors
          origin: null,
          type: COORDINATE_SYSTEM_TYPE,
        },
        altitudeReference: {
          ...DEFAULT_ALTITUDE_REFERENCE,
        },
      },
      indoor: {
        coordinateSystem: {
          orientation: '0', // stored as a string to avoid rounding errors
        },
        room: {
          visible: false,
          firstCorner: [
            -DEFAULT_ROOM_SIZE.width / 2,
            -DEFAULT_ROOM_SIZE.depth / 2,
            0,
          ],
          secondCorner: [
            DEFAULT_ROOM_SIZE.width / 2,
            DEFAULT_ROOM_SIZE.depth / 2,
            DEFAULT_ROOM_SIZE.height,
          ],
        },
      },
      type: 'outdoor',
    },

    loadShowFromCloudDialog: {
      open: false,
    },

    manualPreflightChecksDialog: {
      open: false,
    },

    onboardPreflightChecksDialog: {
      open: false,
    },

    preflight: {
      manualChecksSignedOffAt: null,
      onboardChecksSignedOffAt: null,
      takeoffAreaApprovedAt: null,
    },

    start: {
      // whether the show has been authorized to start
      authorized: false,

      // ID of the reference clock that the start time is based on; `null`
      // means UTC time
      clock: null,

      // the start time of the show, in UTC time, used if and only if clock is
      // falsy
      utcTime: null,

      // start time of the show in the related reference clock, in seconds
      timeOnClock: null,

      // whether the show is started automatically or manually with a remote
      // controller
      method: StartMethod.RC,

      // the list of UAV IDs that the server will start automatically. This
      // value is read from the server only but is never written there; we will
      // infer the UAV ID list from the mapping instead and write that to the
      // server. It is not relevant if the show is set to start manually
      uavIds: [],

      // whether the state variables in this object are synced with the server
      syncStatusWithServer: 'notSynced',
    },

    startTimeDialog: {
      open: false,
    },

    takeoffAreaSetupDialog: {
      open: false,
    },
  },

  reducers: {
    approveTakeoffAreaAt(state, action) {
      state.preflight.takeoffAreaApprovedAt = action.payload;
    },

    clearLoadedShow: noPayload((state) => {
      state.data = null;

      state.sourceUrl = null;
      state.changedSinceLoaded = false;

      state.preflight.manualChecksSignedOffAt = null;
      state.preflight.onboardChecksSignedOffAt = null;
      state.preflight.takeoffAreaApprovedAt = null;

      // Last upload result cleared in the upload feature as it also handles
      // this action
    }),

    clearManualPreflightChecks: noPayload((state) => {
      state.preflight.manualChecksSignedOffAt = null;
    }),

    clearOnboardPreflightChecks: noPayload((state) => {
      state.preflight.onboardChecksSignedOffAt = null;
    }),

    clearStartTimeAndMethod(state) {
      state.start.utcTime = null;
      state.start.timeOnClock = null;
      state.start.method = StartMethod.RC;
    },

    closeEnvironmentEditorDialog: noPayload((state) => {
      state.environment.editing = false;
    }),

    closeLoadShowFromCloudDialog: noPayload((state) => {
      state.loadShowFromCloudDialog.open = false;
    }),

    closeManualPreflightChecksDialog: noPayload((state) => {
      state.manualPreflightChecksDialog.open = false;
    }),

    closeOnboardPreflightChecksDialog: noPayload((state) => {
      state.onboardPreflightChecksDialog.open = false;
    }),

    closeStartTimeDialog: noPayload((state) => {
      state.startTimeDialog.open = false;
    }),

    closeTakeoffAreaSetupDialog: noPayload((state) => {
      state.takeoffAreaSetupDialog.open = false;
    }),

    loadingProgress(state, action) {
      if (state.loading) {
        const value = Number(action.payload);
        if (Number.isNaN(value)) {
          state.progress = null;
        } else {
          state.progress = Math.min(1, Math.max(value, 0));
        }
      }
    },

    loadingPromisePending(state) {
      state.loading = true;
      state.progress = null;

      // This line ensures that the "show changed" warning goes away as soon as
      // the user starts to reload the show
      state.changedSinceLoaded = false;
    },

    loadingPromiseFulfilled(state, action) {
      const { spec, url } = action.payload;

      state.data = spec;
      state.sourceUrl = url || null;
      state.loading = false;
      state.progress = null;

      // Just in case the "show changed" warning was triggered while we tried
      // to load it...
      state.changedSinceLoaded = false;
    },

    loadingPromiseRejected(state) {
      state.loading = false;
      state.progress = null;

      state.changedSinceLoaded = false;
    },

    notifyShowFileChangedSinceLoaded(state) {
      state.changedSinceLoaded = true;
    },

    openEnvironmentEditorDialog: noPayload((state) => {
      state.environment.editing = true;
    }),

    openLoadShowFromCloudDialog: noPayload((state) => {
      state.loadShowFromCloudDialog.open = true;
    }),

    openManualPreflightChecksDialog: noPayload((state) => {
      state.manualPreflightChecksDialog.open = true;
    }),

    openOnboardPreflightChecksDialog: noPayload((state) => {
      state.onboardPreflightChecksDialog.open = true;
    }),

    openStartTimeDialog: noPayload((state) => {
      state.startTimeDialog.open = true;
    }),

    openTakeoffAreaSetupDialog: noPayload((state) => {
      state.takeoffAreaSetupDialog.open = true;
    }),

    revokeTakeoffAreaApproval: noPayload((state) => {
      state.preflight.takeoffAreaApprovedAt = null;
    }),

    setEnvironmentType(state, action) {
      state.environment.type = action.payload;
    },

    setLastLoadingAttemptFailed(state, action) {
      state.lastLoadAttemptFailed = Boolean(action.payload);
    },

    _setOutdoorShowAltitudeReference(state, action) {
      const { payload } = action;

      if (
        typeof payload === 'object' &&
        typeof payload.type !== 'undefined' &&
        typeof payload.value !== 'undefined'
      ) {
        state.environment.outdoor.altitudeReference = payload;
      }
    },

    setOutdoorShowOrientation(state, action) {
      state.environment.outdoor.coordinateSystem.orientation = String(
        action.payload
      );
    },

    setOutdoorShowOrigin(state, action) {
      state.environment.outdoor.coordinateSystem.origin =
        action.payload || null;
    },

    setRoomCorners(state, action) {
      const corners = action.payload;
      if (!Array.isArray(corners) || corners.length < 2) {
        return;
      }

      const firstCorner = corners[0];
      const secondCorner = corners[1];

      if (
        !Array.isArray(firstCorner) ||
        firstCorner.length < 3 ||
        !Array.isArray(secondCorner) ||
        secondCorner.length < 3
      ) {
        return;
      }

      set(
        state,
        'environment.indoor.room.firstCorner',
        firstCorner.slice(0, 3)
      );
      set(
        state,
        'environment.indoor.room.secondCorner',
        secondCorner.slice(0, 3)
      );
    },

    setRoomVisibility(state, action) {
      set(state, 'environment.indoor.room.visible', Boolean(action.payload));
    },

    setShowAuthorization(state, action) {
      // We only accept 'true' for authorization to be on the safe side, not
      // just any truthy value
      state.start.authorized = action.payload === true;
    },

    setShowSettingsSynchronizationStatus(state, action) {
      if (
        ['synced', 'notSynced', 'inProgress', 'error'].includes(action.payload)
      ) {
        state.start.syncStatusWithServer = action.payload;
      }
    },

    setStartMethod(state, action) {
      if (StartMethod._VALUES.includes(action.payload)) {
        state.start.method = action.payload;
      }
    },

    setStartTime(state, action) {
      const { payload } = action;
      const { clock, time: timeFromPayload } = payload || {};

      state.start.clock = isNil(clock) || clock === '' ? null : String(clock);

      const hasClock = !isNil(state.start.clock);

      if (hasClock) {
        state.start.timeOnClock =
          isNil(timeFromPayload) || typeof timeFromPayload !== 'number'
            ? null
            : timeFromPayload;
      } else {
        const dateTime =
          timeFromPayload instanceof Date
            ? getUnixTime(timeFromPayload)
            : timeFromPayload;
        if (typeof dateTime === 'number') {
          state.start.utcTime = dateTime;
        } else {
          state.start.utcTime = null;
        }
      }
    },

    setUAVIdsToStartAutomatically(state, action) {
      if (Array.isArray(action.payload)) {
        state.start.uavIds = action.payload;
      }
    },

    signOffOnManualPreflightChecksAt(state, action) {
      state.preflight.manualChecksSignedOffAt = action.payload;
    },

    signOffOnOnboardPreflightChecksAt(state, action) {
      state.preflight.onboardChecksSignedOffAt = action.payload;
    },

    synchronizeShowSettings() {
      // Nothing to do, this action simply triggers a saga that will do the
      // hard work.
    },
  },
});

export const {
  approveTakeoffAreaAt,
  clearLoadedShow,
  clearManualPreflightChecks,
  clearOnboardPreflightChecks,
  clearStartTimeAndMethod,
  closeEnvironmentEditorDialog,
  closeLoadShowFromCloudDialog,
  closeManualPreflightChecksDialog,
  closeOnboardPreflightChecksDialog,
  closeStartTimeDialog,
  closeTakeoffAreaSetupDialog,
  loadingProgress,
  loadingPromiseFulfilled,
  notifyShowFileChangedSinceLoaded,
  openEnvironmentEditorDialog,
  openLoadShowFromCloudDialog,
  openManualPreflightChecksDialog,
  openOnboardPreflightChecksDialog,
  openStartTimeDialog,
  openTakeoffAreaSetupDialog,
  revokeTakeoffAreaApproval,
  setEnvironmentType,
  setLastLoadingAttemptFailed,
  _setOutdoorShowAltitudeReference,
  setOutdoorShowOrientation,
  setOutdoorShowOrigin,
  setRoomCorners,
  setRoomVisibility,
  setShowAuthorization,
  setShowSettingsSynchronizationStatus,
  setStartMethod,
  setStartTime,
  setUAVIdsToStartAutomatically,
  signOffOnManualPreflightChecksAt,
  signOffOnOnboardPreflightChecksAt,
  synchronizeShowSettings,
} = actions;

export default reducer;
