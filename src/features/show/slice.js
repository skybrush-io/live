/**
 * @file Slice of the state object that stores the settings of the current drone
 * show being executed.
 */

import { getUnixTime } from 'date-fns';
import isNil from 'lodash-es/isNil';

import { createSlice } from '@reduxjs/toolkit';

import { COORDINATE_SYSTEM_TYPE } from './constants';
import { moveItemsBetweenQueues } from './utils';
import { convexHull } from '~/utils/math';

import { noPayload } from '~/utils/redux';

const { actions, reducer } = createSlice({
  name: 'show',

  initialState: {
    data: null,

    loading: false,
    progress: 0,

    sourceUrl: null,
    changedSinceLoaded: false,

    geofenceCoordinates: [],

    environment: {
      editing: false,
      outdoor: {
        coordinateSystem: {
          orientation: '0', // stored as a string to avoid rounding errors
          origin: null,
          type: COORDINATE_SYSTEM_TYPE,
        },
      },
      indoor: {
        coordinateSystem: {
          orientation: '0', // stored as a string to avoid rounding errors
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

      // the start time of the show
      time: null,

      // whether the show is started automatically or manually with a remote
      // controller
      method: 'rc',

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

    upload: {
      autoRetry: false,
      failedItems: [],
      lastUploadResult: null,
      running: false,
      itemsInProgress: [],
      itemsWaitingToStart: [],
      itemsQueued: [],
      itemsFinished: [],
    },

    uploadDialog: {
      open: false,
      showLastUploadResult: false,
      uploadTarget: 'all',
    },
  },

  reducers: {
    approveTakeoffAreaAt(state, action) {
      state.preflight.takeoffAreaApprovedAt = action.payload;
    },

    cancelUpload: noPayload(() => {
      // The action will stop the upload saga; nothing to do here.
      // State will be update in notifyUploadFinished()
    }),

    clearLoadedShow: noPayload((state) => {
      state.data = null;

      state.sourceUrl = null;
      state.changedSinceLoaded = false;

      state.preflight.manualChecksSignedOffAt = null;
      state.preflight.onboardChecksSignedOffAt = null;
      state.preflight.takeoffAreaApprovedAt = null;

      state.upload.lastUploadResult = null;
    }),

    clearManualPreflightChecks: noPayload((state) => {
      state.preflight.manualChecksSignedOffAt = null;
    }),

    clearOnboardPreflightChecks: noPayload((state) => {
      state.preflight.onboardChecksSignedOffAt = null;
    }),

    clearStartTimeAndMethod(state) {
      state.start.time = null;
      state.start.method = 'rc';
    },

    clearUploadQueue: noPayload((state) => {
      state.upload.itemsWaitingToStart = [];
    }),

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

    closeUploadDialog: noPayload((state) => {
      state.uploadDialog.open = false;
    }),

    dismissLastUploadResult: noPayload((state) => {
      state.uploadDialog.showLastUploadResult = false;
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

      // This line ensures that the green light in front of the UploadButton
      // turns off if the user starts loading a new show
      state.upload.lastUploadResult = null;
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

    notifyUploadFinished: (state, action) => {
      const { success, cancelled } = action.payload;

      // Dispatched by the saga; should not be dispatched manually
      // TODO(ntamas): move all items still in progress back to the queue
      state.upload.itemsInProgress = [];
      state.upload.itemsQueued = [];
      state.upload.running = false;
      state.upload.lastUploadResult = cancelled
        ? 'cancelled'
        : success
        ? 'success'
        : 'error';
      state.uploadDialog.showLastUploadResult = true;
    },

    notifyUploadOnUavCancelled(state, action) {
      moveItemsBetweenQueues({
        source: 'itemsInProgress',
        target: 'itemsWaitingToStart',
        state,
        action,
      });
    },

    notifyUploadOnUavFailed(state, action) {
      moveItemsBetweenQueues({
        source: 'itemsInProgress',
        target: 'failedItems',
        state,
        action,
      });
    },

    notifyUploadOnUavQueued(state, action) {
      moveItemsBetweenQueues({
        source: 'itemsWaitingToStart',
        target: 'itemsQueued',
        state,
        action,
      });
    },

    notifyUploadOnUavStarted(state, action) {
      moveItemsBetweenQueues({
        source: 'itemsQueued',
        target: 'itemsInProgress',
        state,
        action,
      });
    },

    notifyUploadOnUavSucceeded(state, action) {
      moveItemsBetweenQueues({
        source: 'itemsInProgress',
        target: 'itemsFinished',
        state,
        action,
      });
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

    openUploadDialog: noPayload((state) => {
      state.upload.lastUploadResult = null;
      state.uploadDialog.showLastUploadResult = false;
      state.uploadDialog.open = true;
      state.uploadDialog.uploadTarget = 'all';
    }),

    prepareForNextUpload(state, action) {
      const { payload } = action;

      state.upload.failedItems = [];
      state.upload.itemsFinished = [];
      state.upload.itemsQueued = [];
      state.upload.itemsWaitingToStart = [...payload];
      state.uploadDialog.showLastUploadResult = false;
    },

    recalculateAutoGeofence: noPayload((state) => {
      /*
      const allDroneCoordinates = [].concat(
        ...state.data.swarm.drones.map((d) =>
          d.settings.trajectory.points.map((p) => [p[1][0], p[1][1]])
        )
      );

      state.geofenceCoordinates = convexHull(allDroneCoordinates);
      */
    }),

    revokeTakeoffAreaApproval: noPayload((state) => {
      state.preflight.takeoffAreaApprovedAt = null;
    }),

    setEnvironmentType(state, action) {
      state.environment.type = action.payload;
    },

    _enqueueFailedUploads(state, action) {
      moveItemsBetweenQueues({
        source: 'failedItems',
        target: 'itemsWaitingToStart',
        state,
        action,
      });
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
      if (action.payload === 'rc' || action.payload === 'auto') {
        state.start.method = action.payload;
      }
    },

    setStartTime(state, action) {
      const { payload } = action;

      if (isNil(payload)) {
        state.start.time = null;
      } else {
        const dateTime =
          payload instanceof Date ? getUnixTime(payload) : payload;

        if (typeof dateTime === 'number') {
          state.start.time = dateTime;
        }
      }
    },

    setUAVIdsToStartAutomatically(state, action) {
      if (Array.isArray(action.payload)) {
        state.start.uavIds = action.payload;
      }
    },

    setUploadAutoRetry(state, action) {
      state.upload.autoRetry = Boolean(action.payload);
    },

    setUploadTarget(state, action) {
      state.uploadDialog.uploadTarget = action.payload;
    },

    signOffOnManualPreflightChecksAt(state, action) {
      state.preflight.manualChecksSignedOffAt = action.payload;
    },

    signOffOnOnboardPreflightChecksAt(state, action) {
      state.preflight.onboardChecksSignedOffAt = action.payload;
    },

    startUpload(state) {
      state.upload.running = true;
      // Nothing else to do, this action simply triggers a saga that will do the
      // hard work. The saga might be triggered a bit earlier than the previous
      // assignment, but we don't care.
    },

    synchronizeShowSettings() {
      // Nothing to do, this action simply triggers a saga that will do the
      // hard work.
    },
  },
});

export const {
  approveTakeoffAreaAt,
  cancelUpload,
  clearLoadedShow,
  clearManualPreflightChecks,
  clearOnboardPreflightChecks,
  clearStartTimeAndMethod,
  clearUploadQueue,
  closeEnvironmentEditorDialog,
  closeLoadShowFromCloudDialog,
  closeManualPreflightChecksDialog,
  closeOnboardPreflightChecksDialog,
  closeStartTimeDialog,
  closeTakeoffAreaSetupDialog,
  closeUploadDialog,
  dismissLastUploadResult,
  loadingProgress,
  loadingPromiseFulfilled,
  notifyShowFileChangedSinceLoaded,
  notifyUploadFinished,
  notifyUploadOnUavCancelled,
  notifyUploadOnUavFailed,
  notifyUploadOnUavQueued,
  notifyUploadOnUavStarted,
  notifyUploadOnUavSucceeded,
  openEnvironmentEditorDialog,
  openLoadShowFromCloudDialog,
  openManualPreflightChecksDialog,
  openOnboardPreflightChecksDialog,
  openStartTimeDialog,
  openTakeoffAreaSetupDialog,
  openUploadDialog,
  prepareForNextUpload,
  _enqueueFailedUploads,
  recalculateAutoGeofence,
  revokeTakeoffAreaApproval,
  setEnvironmentType,
  setOutdoorShowOrientation,
  setOutdoorShowOrigin,
  setShowAuthorization,
  setShowSettingsSynchronizationStatus,
  setStartMethod,
  setStartTime,
  setUAVIdsToStartAutomatically,
  setUploadAutoRetry,
  setUploadTarget,
  signOffOnManualPreflightChecksAt,
  signOffOnOnboardPreflightChecksAt,
  startUpload,
  synchronizeShowSettings,
  uploadingPromisePending,
  uploadingPromiseFulfilled,
  uploadingPromiseRejected,
} = actions;

export default reducer;
