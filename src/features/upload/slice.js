/**
 * @file Slice of the state object that stores the settings of the current drone
 * show being executed.
 */

import { createSlice } from '@reduxjs/toolkit';

import { ensureItemsInQueue, moveItemsBetweenQueues } from './utils';

import { noPayload } from '~/utils/redux';

const { actions, reducer } = createSlice({
  name: 'upload',

  initialState: {
    autoRetry: false,
    lastUploadResult: null,
    running: false,

    queues: {
      itemsInProgress: [],
      itemsWaitingToStart: [],
      itemsQueued: [],
      itemsFinished: [],
      failedItems: [],
    },

    // If you add a new queue above, make sure that the ALL_QUEUES array
    // is updated in features/upload/utils.js

    dialog: {
      open: false,
      showLastUploadResult: false,
    },
  },

  reducers: {
    cancelUpload: noPayload(() => {
      // The action will stop the upload saga; nothing to do here.
      // State will be updated in notifyUploadFinished()
    }),

    clearLastUploadResult: noPayload((state) => {
      state.lastUploadResult = null;
    }),

    clearUploadQueue: noPayload((state) => {
      state.queues.itemsWaitingToStart = [];
    }),

    closeUploadDialog: noPayload((state) => {
      state.dialog.open = false;
    }),

    dismissLastUploadResult: noPayload((state) => {
      state.dialog.showLastUploadResult = false;
    }),

    notifyUploadFinished: (state, action) => {
      const { success, cancelled } = action.payload;

      // Dispatched by the saga; should not be dispatched manually
      state.queues.itemsWaitingToStart = [];
      state.queues.itemsInProgress = [];
      state.queues.itemsQueued = [];
      state.running = false;
      state.lastUploadResult = cancelled
        ? 'cancelled'
        : success
        ? 'success'
        : 'error';
      state.dialog.showLastUploadResult = true;
    },

    notifyUploadOnUavCancelled: moveItemsBetweenQueues({
      source: 'itemsInProgress',
      target: 'itemsWaitingToStart',
    }),

    notifyUploadOnUavFailed: moveItemsBetweenQueues({
      source: 'itemsInProgress',
      target: 'failedItems',
    }),

    notifyUploadOnUavQueued: moveItemsBetweenQueues({
      source: 'itemsWaitingToStart',
      target: 'itemsQueued',
    }),

    notifyUploadOnUavStarted: moveItemsBetweenQueues({
      source: 'itemsQueued',
      target: 'itemsInProgress',
    }),

    notifyUploadOnUavSucceeded: moveItemsBetweenQueues({
      source: 'itemsInProgress',
      target: 'itemsFinished',
    }),

    openUploadDialog: noPayload((state) => {
      state.lastUploadResult = null;
      state.dialog.showLastUploadResult = false;
      state.dialog.open = true;
    }),

    prepareForNextUpload(state, action) {
      const { payload } = action;

      state.queues.failedItems = [];
      state.queues.itemsFinished = [];
      state.queues.itemsQueued = [];
      state.queues.itemsWaitingToStart = [...payload];
      state.dialog.showLastUploadResult = false;
    },

    putUavInWaitingQueue: ensureItemsInQueue({
      target: 'itemsWaitingToStart',
      doNotMoveWhenIn: ['itemsQueued', 'itemsInProgress'],
    }),

    removeUavFromWaitingQueue: ensureItemsInQueue({
      target: undefined,
      doNotMoveWhenIn: ['itemsQueued', 'itemsInProgress'],
    }),

    _enqueueFailedUploads: moveItemsBetweenQueues({
      source: 'failedItems',
      target: 'itemsWaitingToStart',
    }),

    _enqueueSuccessfulUploads: moveItemsBetweenQueues({
      source: 'itemsFinished',
      target: 'itemsWaitingToStart',
    }),

    setUploadAutoRetry(state, action) {
      state.autoRetry = Boolean(action.payload);
    },

    startUpload(state) {
      state.running = true;
      state.dialog.showLastUploadResult = false;
      // Nothing else to do, this action simply triggers a saga that will do the
      // hard work. The saga might be triggered a bit earlier than the previous
      // assignment, but we don't care.
    },
  },
});

export const {
  cancelUpload,
  clearLastUploadResult,
  clearUploadQueue,
  closeUploadDialog,
  dismissLastUploadResult,
  _enqueueFailedUploads,
  _enqueueSuccessfulUploads,
  notifyUploadFinished,
  notifyUploadOnUavCancelled,
  notifyUploadOnUavFailed,
  notifyUploadOnUavQueued,
  notifyUploadOnUavStarted,
  notifyUploadOnUavSucceeded,
  openUploadDialog,
  prepareForNextUpload,
  putUavInWaitingQueue,
  removeUavFromWaitingQueue,
  setUploadAutoRetry,
  startUpload,
} = actions;

export default reducer;
