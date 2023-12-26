/**
 * @file Slice of the state object that stores the settings of the current drone
 * show being executed.
 */

import { type Action, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { type ReadonlyDeep } from 'type-fest';

import { SHOW_UPLOAD_JOB } from '~/features/show/constants';
import { clearLoadedShow } from '~/features/show/slice';
import type UAV from '~/model/uav';
import { type Collection, replaceItemOrAddToFront } from '~/utils/collections';
import { noPayload } from '~/utils/redux';

import { type JobPayload, type UploadJob } from './types';
import {
  clearLastUploadResultForJobTypeHelper,
  clearQueues,
  ensureItemsInQueue,
  moveItemsBetweenQueues,
} from './utils';

export type UploadSliceState = ReadonlyDeep<{
  currentJob: {
    /**
     * Type of current job being executed by the uploader. Value is kept after
     * the job finishes so we can restart it if needed.
     */

    // TODO: Maybe create a unique symbol for job types?
    type?: string;

    /**
     * Payload of current job; can be an arbitrary object and it is the
     * task of the upload saga to interpret it. Its semantics primarily
     * depends on the type of the current job. Value is kept after
     * the job finishes so we can restart it if needed.
     */
    payload?: JobPayload;

    /** Whether the job is running or not */
    running: boolean;
  };

  /**
   * History of recent upload jobs. Each upload job has a _type_ and a
   * _hash_; the type identifies the type of the job (e.g., show upload,
   * parameter upload etc) while the key is a compact representation of the
   * exact data that was uploaded such that different jobs of the same type
   * have different keys. In the absence of such a hash, use a sequential
   * counter. The ID of the job should be the type and we only keep the
   * latest job from each type in the history.
   */
  history: Collection<UploadJob>;

  queues: {
    itemsInProgress: Array<UAV['id']>;
    itemsWaitingToStart: Array<UAV['id']>;
    itemsQueued: Array<UAV['id']>;
    itemsFinished: Array<UAV['id']>;
    failedItems: Array<UAV['id']>;
  };

  // If you add a new queue above, make sure that the ALL_QUEUES array
  // is updated in features/upload/utils.js

  errors: Record<UAV['id'], unknown>;

  dialog: {
    open: boolean;
    showLastUploadResult: boolean;
    selectedJob: {
      type?: string;
      payload?: JobPayload;
    };
    backAction?: Action;
  };

  /** Persistent part of the slice */
  settings: {
    /** Whether failed upload jobs should be automatically retried */
    autoRetry: boolean;

    /**
     * Whether the lights of the drones with
     * failed uploads should be flashed
     */
    flashFailed: boolean;
  };
}>;

const initialState: UploadSliceState = {
  currentJob: {
    type: undefined,
    payload: undefined,
    running: false,
  },

  history: {
    order: [],
    byId: {},
  },
  queues: {
    itemsInProgress: [],
    itemsWaitingToStart: [],
    itemsQueued: [],
    itemsFinished: [],
    failedItems: [],
  },
  errors: {},
  dialog: {
    open: false,
    showLastUploadResult: false,
    selectedJob: {
      type: undefined,
      payload: undefined,
    },
    backAction: undefined,
  },
  settings: {
    autoRetry: false,
    flashFailed: false,
  },
};

const { actions, reducer } = createSlice({
  name: 'upload',
  initialState,
  reducers: {
    clearLastUploadResultForJobType(state, action: PayloadAction<string>) {
      const { payload: jobType } = action;
      if (jobType) {
        clearLastUploadResultForJobTypeHelper(state, jobType);
      }
    },

    clearUploadQueue: noPayload<UploadSliceState>((state) => {
      state.queues.itemsWaitingToStart = [];
    }),

    closeUploadDialog: noPayload<UploadSliceState>((state) => {
      state.dialog.open = false;
    }),

    dismissLastUploadResult: noPayload<UploadSliceState>((state) => {
      state.dialog.showLastUploadResult = false;
    }),

    putUavsInWaitingQueue: ensureItemsInQueue({
      target: 'itemsWaitingToStart',
      doNotMoveWhenIn: ['itemsQueued', 'itemsInProgress'],
    }),

    removeUavsFromWaitingQueue: ensureItemsInQueue({
      target: undefined,
      doNotMoveWhenIn: ['itemsQueued', 'itemsInProgress'],
    }),

    setupNextUploadJob(
      state,
      action: PayloadAction<{
        type: string;
        payload: JobPayload;
        targets: Array<UAV['id']>;
      }>
    ) {
      const { payload } = action;
      const { type, payload: jobPayload, targets } = payload;

      /* Do not do anything if a job is currently running */
      if (state.currentJob.running) {
        return;
      }

      state.currentJob.type = type;
      state.currentJob.payload = jobPayload;

      clearQueues(state);

      state.queues.itemsWaitingToStart = [...targets];
    },

    setUploadAutoRetry(state, action: PayloadAction<boolean>) {
      state.settings.autoRetry = Boolean(action.payload);
    },

    setFlashFailed(state, action: PayloadAction<boolean>) {
      state.settings.flashFailed = Boolean(action.payload);
    },

    // Private actions that should be dispatched only from the uploader saga

    _enqueueFailedUploads: moveItemsBetweenQueues({
      source: 'failedItems',
      target: 'itemsWaitingToStart',
    }),

    _enqueueSuccessfulUploads: moveItemsBetweenQueues({
      source: 'itemsFinished',
      target: 'itemsWaitingToStart',
    }),

    _notifyUploadFinished(
      state,
      action: PayloadAction<{ success: boolean; cancelled: boolean }>
    ) {
      const { success, cancelled } = action.payload;

      // Dispatched by the saga; should not be dispatched manually

      // Clear the queues
      state.queues.itemsWaitingToStart = [];
      state.queues.itemsInProgress = [];
      state.queues.itemsQueued = [];

      // Reset the current job to an idle state
      state.currentJob.running = false;

      // Store the upload result in the history
      if (state.currentJob.type) {
        const historyItem: UploadJob = {
          id: state.currentJob.type,
          payload: state.currentJob.payload,
          result: cancelled ? 'cancelled' : success ? 'success' : 'error',
        };
        replaceItemOrAddToFront(state.history, historyItem);
      }

      // Trigger the dialog box to show the result
      state.dialog.showLastUploadResult = true;
    },

    _notifyUploadStarted(state) {
      // Start the upload
      state.currentJob.running = true;

      // Hide the result of the last upload task in the dialog box
      state.dialog.showLastUploadResult = false;
    },

    _notifyUploadOnUavCancelled: moveItemsBetweenQueues({
      source: 'itemsInProgress',
      target: 'itemsWaitingToStart',
    }),

    _notifyUploadOnUavFailed: moveItemsBetweenQueues({
      source: 'itemsInProgress',
      target: 'failedItems',
    }),

    _notifyUploadOnUavQueued: moveItemsBetweenQueues({
      source: 'itemsWaitingToStart',
      target: 'itemsQueued',
    }),

    _notifyUploadOnUavStarted: moveItemsBetweenQueues({
      source: 'itemsQueued',
      target: 'itemsInProgress',
    }),

    _notifyUploadOnUavSucceeded: moveItemsBetweenQueues({
      source: 'itemsInProgress',
      target: 'itemsFinished',
    }),

    _setErrorMessageForUAV: {
      reducer(
        state,
        action: PayloadAction<{ uavId: UAV['id']; message: string }>
      ) {
        const { uavId, message } = action.payload;
        if (message) {
          state.errors[uavId] = message;
        } else {
          delete state.errors[uavId];
        }
      },

      prepare: (uavId: UAV['id'], message: string | Error) => ({
        payload: { uavId, message: String(message) },
      }),
    },

    openUploadDialogKeepingCurrentJob(
      state,
      action: PayloadAction<{ backAction?: Action }>
    ) {
      const { payload: options } = action;
      const { backAction } = options ?? {};

      // This action is allowed only if the upload dialog already has a job
      // type
      if (state.dialog.selectedJob?.type) {
        state.dialog.open = true;
        state.dialog.backAction = backAction;
      }
    },

    openUploadDialogForJob(
      state,
      action: PayloadAction<{
        job?: { type?: string; payload?: JobPayload };
        options?: { backAction?: Action };
      }>
    ) {
      const { payload } = action;
      const { job, options } = payload ?? {};
      const { type: newJobType, payload: newJobPayload } = job ?? {};
      const { backAction } = options ?? {};

      // Do not do anything without a job type
      if (!newJobType) {
        return;
      }

      // If the job type changed and no upload task is running, clear the
      // queues
      if (
        !state.currentJob.running &&
        state.dialog.selectedJob?.type !== newJobType
      ) {
        clearQueues(state);
      }

      state.dialog.backAction = backAction;
      state.dialog.selectedJob = {
        type: newJobType,
        payload: newJobPayload,
      };
      state.dialog.showLastUploadResult = false;
      state.dialog.open = true;
    },

    // Trigger actions for the upload saga

    startUpload: noPayload<UploadSliceState>(() => {
      // Nothing else to do, this action triggers a saga as a side effect and
      // the saga will do the hard work.
    }),

    cancelUpload: noPayload<UploadSliceState>(() => {
      // The action will stop the upload saga; nothing to do here.
      // State will be updated in _notifyUploadFinished()
    }),
  },

  extraReducers(builder) {
    builder.addCase(clearLoadedShow, (state) => {
      clearLastUploadResultForJobTypeHelper(state, SHOW_UPLOAD_JOB.type);
    });
  },
});

export const {
  cancelUpload,
  clearLastUploadResultForJobType,
  clearUploadQueue,
  closeUploadDialog,
  dismissLastUploadResult,
  _enqueueFailedUploads,
  _enqueueSuccessfulUploads,
  _notifyUploadFinished,
  _notifyUploadStarted,
  _notifyUploadOnUavCancelled,
  _notifyUploadOnUavFailed,
  _notifyUploadOnUavQueued,
  _notifyUploadOnUavStarted,
  _notifyUploadOnUavSucceeded,
  _setErrorMessageForUAV,
  openUploadDialogForJob,
  openUploadDialogKeepingCurrentJob,
  setupNextUploadJob,
  putUavsInWaitingQueue,
  removeUavsFromWaitingQueue,
  setUploadAutoRetry,
  setFlashFailed,
  startUpload,
} = actions;

export default reducer;
