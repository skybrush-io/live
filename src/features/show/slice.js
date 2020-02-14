/**
 * @file Slice of the state object that stores the settings of the current drone
 * show being executed.
 */

import { createSlice } from '@reduxjs/toolkit';

import { moveItemsBetweenQueues } from './utils';

import { noPayload } from '~/utils/redux';

const { actions, reducer } = createSlice({
  name: 'show',

  initialState: {
    data: null,

    loading: false,

    environment: {
      editing: false,
      outdoor: {
        coordinateSystem: {
          orientation: '0', // stored as a string to avoid rounding errors
          origin: null
        }
      },
      type: 'outdoor'
    },

    preflight: {
      manualChecksSignedOffAt: null,
      onboardChecksSignedOffAt: null,
      takeoffAreaApprovedAt: null
    },

    takeoffAreaSetupDialog: {
      open: false
    },

    upload: {
      failedItems: [],
      lastUploadResult: null,
      running: false,
      itemsInProgress: [],
      itemsWaitingToStart: [],
      itemsQueued: []
    },

    uploadDialog: {
      open: false,
      showLastUploadResult: false,
      uploadTarget: 'all'
    }
  },

  reducers: {
    approveTakeoffAreaAt(state, action) {
      state.preflight.takeoffAreaApprovedAt = action.payload;
    },

    cancelUpload: noPayload(() => {
      // The action will stop the upload saga; nothing to do here.
      // State will be update in notifyUploadFinished()
    }),

    clearLoadedShow: noPayload(state => {
      state.data = null;

      state.preflight.manualChecksSignedOffAt = null;
      state.preflight.onboardChecksSignedOffAt = null;
      state.preflight.takeoffAreaApprovedAt = null;
    }),

    clearManualPreflightChecks: noPayload(state => {
      state.preflight.manualChecksSignedOffAt = null;
    }),

    clearOnboardPreflightChecks: noPayload(state => {
      state.preflight.onboardChecksSignedOffAt = null;
    }),

    clearUploadQueue: noPayload(state => {
      state.upload.itemsWaitingToStart = [];
    }),

    closeEnvironmentEditorDialog: noPayload(state => {
      state.environment.editing = false;
    }),

    closeTakeoffAreaSetupDialog: noPayload(state => {
      state.takeoffAreaSetupDialog.open = false;
    }),

    closeUploadDialog: noPayload(state => {
      state.uploadDialog.open = false;
    }),

    dismissLastUploadResult: noPayload(state => {
      state.uploadDialog.showLastUploadResult = false;
    }),

    loadingPromisePending(state) {
      state.loading = true;
    },

    loadingPromiseFulfilled(state, action) {
      state.data = action.payload;
      state.loading = false;
    },

    loadingPromiseRejected(state) {
      state.loading = false;
    },

    notifyUploadFinished: (state, action) => {
      const { success, cancelled } = action.payload;

      // Dispatched by the saga; should not be dispatched manually
      // TODO(ntamas): move all items still in progress back to the queue
      state.upload.itemsInProgress = [];
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
        action
      });
    },

    notifyUploadOnUavFailed(state, action) {
      moveItemsBetweenQueues({
        source: 'itemsInProgress',
        target: 'failedItems',
        state,
        action
      });
    },

    notifyUploadOnUavQueued(state, action) {
      moveItemsBetweenQueues({
        source: 'itemsWaitingToStart',
        target: 'itemsQueued',
        state,
        action
      });
    },

    notifyUploadOnUavStarted(state, action) {
      moveItemsBetweenQueues({
        source: 'itemsQueued',
        target: 'itemsInProgress',
        state,
        action
      });
    },

    notifyUploadOnUavSucceeded(state, action) {
      moveItemsBetweenQueues({
        source: 'itemsInProgress',
        state,
        action
      });
    },

    openEnvironmentEditorDialog: noPayload(state => {
      state.environment.editing = true;
    }),

    openTakeoffAreaSetupDialog: noPayload(state => {
      state.takeoffAreaSetupDialog.open = true;
    }),

    openUploadDialog: noPayload(state => {
      state.upload.lastUploadResult = null;
      state.uploadDialog.showLastUploadResult = false;
      state.uploadDialog.open = true;
      state.uploadDialog.uploadTarget = 'all';
    }),

    revokeTakeoffAreaApproval: noPayload(state => {
      state.preflight.takeoffAreaApprovedAt = null;
    }),

    setEnvironmentType(state, action) {
      state.environment.type = action.payload;
    },

    _retryFailedUploads(state, action) {
      moveItemsBetweenQueues({
        source: 'failedItems',
        target: 'itemsWaitingToStart',
        state,
        action
      });
    },

    _setOutdoorShowOrientation(state, action) {
      state.environment.outdoor.coordinateSystem.orientation = String(
        action.payload
      );
    },

    setOutdoorShowOrigin(state, action) {
      state.environment.outdoor.coordinateSystem.origin =
        action.payload || null;
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

    startUpload: noPayload(state => {
      // TODO(ntamas): we must make sure that the next line is processed before
      // the saga reacts on the action
      state.upload.failedItems = [];
      state.upload.itemsWaitingToStart = ['A', 'B', 'C', 'D'];
      state.uploadDialog.showLastUploadResult = false;
      state.upload.running = true;
      // Thie action will also trigger the upload saga
    })
  }
});

export const {
  approveTakeoffAreaAt,
  cancelUpload,
  clearLoadedShow,
  clearManualPreflightChecks,
  clearOnboardPreflightChecks,
  clearUploadQueue,
  closeEnvironmentEditorDialog,
  closeTakeoffAreaSetupDialog,
  closeUploadDialog,
  dismissLastUploadResult,
  loadingPromiseFulfilled,
  notifyUploadFinished,
  notifyUploadOnUavCancelled,
  notifyUploadOnUavFailed,
  notifyUploadOnUavQueued,
  notifyUploadOnUavStarted,
  notifyUploadOnUavSucceeded,
  openEnvironmentEditorDialog,
  openTakeoffAreaSetupDialog,
  openUploadDialog,
  _retryFailedUploads,
  revokeTakeoffAreaApproval,
  setEnvironmentType,
  _setOutdoorShowOrientation,
  setOutdoorShowOrigin,
  setUploadTarget,
  signOffOnManualPreflightChecksAt,
  signOffOnOnboardPreflightChecksAt,
  startUpload,
  uploadingPromisePending,
  uploadingPromiseFulfilled,
  uploadingPromiseRejected
} = actions;

export default reducer;
