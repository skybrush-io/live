/**
 * @file Slice of the state object that stores the settings of the current drone
 * show being executed.
 */

import { createSlice } from '@reduxjs/toolkit';

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
      running: false,
      inProgress: [],
      queue: []
    },

    uploadDialog: {
      open: false,
      uploadTarget: 'all'
    }
  },

  reducers: {
    approveTakeoffAreaAt(state, action) {
      state.preflight.takeoffAreaApprovedAt = action.payload;
    },

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

    closeEnvironmentEditorDialog: noPayload(state => {
      state.environment.editing = false;
    }),

    closeTakeoffAreaSetupDialog: noPayload(state => {
      state.takeoffAreaSetupDialog.open = false;
    }),

    closeUploadDialog: noPayload(state => {
      state.uploadDialog.open = false;
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

    openEnvironmentEditorDialog: noPayload(state => {
      state.environment.editing = true;
    }),

    openTakeoffAreaSetupDialog: noPayload(state => {
      state.takeoffAreaSetupDialog.open = true;
    }),

    openUploadDialog: noPayload(state => {
      state.uploadDialog.open = true;
    }),

    revokeTakeoffAreaApproval: noPayload(state => {
      state.preflight.takeoffAreaApprovedAt = null;
    }),

    setEnvironmentType(state, action) {
      state.environment.type = action.payload;
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

    uploadingPromisePending(state) {
      state.upload.running = true;
    },

    uploadingPromiseFulfilled(state) {
      state.upload.running = false;
    },

    uploadingPromiseRejected(state) {
      state.upload.running = false;
    }
  }
});

export const {
  approveTakeoffAreaAt,
  clearLoadedShow,
  clearManualPreflightChecks,
  clearOnboardPreflightChecks,
  closeEnvironmentEditorDialog,
  closeTakeoffAreaSetupDialog,
  closeUploadDialog,
  openEnvironmentEditorDialog,
  openTakeoffAreaSetupDialog,
  openUploadDialog,
  revokeTakeoffAreaApproval,
  setEnvironmentType,
  _setOutdoorShowOrientation,
  setOutdoorShowOrigin,
  setUploadTarget,
  signOffOnManualPreflightChecksAt,
  signOffOnOnboardPreflightChecksAt,
  uploadingPromisePending,
  uploadingPromiseFulfilled,
  uploadingPromiseRejected
} = actions;

export default reducer;
