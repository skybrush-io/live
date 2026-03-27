/**
 * @file Slice of the state object that stores the settings of the current drone
 * show being executed.
 */

import { type Action, createSlice, type PayloadAction } from '@reduxjs/toolkit';

import { SHOW_UPLOAD_JOB } from '~/features/show/constants';
import { _clearLoadedShow } from '~/features/show/slice';
import type { Identifier } from '~/utils/collections';
import { noPayload } from '~/utils/redux';

import type { HistoryItem, JobData, JobPayload } from './types';
import {
  clearQueues,
  clearUploadHistoryForJobTypeHelper,
  compactHistory,
  createHistoryItem,
  ensureItemsInQueue,
  moveItemsBetweenQueues,
} from './utils';

export type UploadSliceState = {
  /**
   * The full description of the current job.
   *
   * `type`: Type of current job being executed by the uploader. Value is kept
   * after the job finishes so we can restart it if needed.
   *
   * `payload`: Payload of current job; can be an arbitrary object and it is
   * the task of the upload saga to interpret it. Its semantics primarily
   * depends on the type of the current job. Value is kept after
   * the job finishes so we can restart it if needed.
   */
  currentJob: JobData & {
    /** Whether the job is running or not */
    running: boolean;
  };

  /**
   * Record that maps job types to the corresponding upload history items.
   */
  history: Record<string, HistoryItem[]>;

  queues: {
    itemsInProgress: Identifier[];
    itemsWaitingToStart: Identifier[];
    itemsQueued: Identifier[];
    itemsFinished: Identifier[];
    failedItems: Identifier[];
  };

  // If you add a new queue above, make sure that the ALL_QUEUES array
  // is updated in features/upload/utils.js

  /** Errors corresponding to the individual UAVs in the current upload job */
  errors: Record<Identifier, string>;

  /** Progress information corresponding to the individual UAVs in the
   * current upload job.
   */
  progresses: Record<Identifier, number>;

  /**
   * Timing information related to the current upload job, required to
   * estimate the time the jobs will finish at the current pace.
   */
  timing: {
    startedAt?: number;
    estimatedEndAt?: number;
  };

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

    /** Whether the lights of the drones with failed uploads should be flashed */
    flashFailed: boolean;

    /**
     * Whether the upload jobs should be restricted to drones
     * that are in the global selection, unless explicitly
     * queued by the user.
     */
    restrictToGlobalSelection: boolean;
  };
};

const initialState: UploadSliceState = {
  currentJob: {
    type: undefined,
    payload: undefined,
    running: false,
  },

  history: {},
  queues: {
    itemsInProgress: [],
    itemsWaitingToStart: [],
    itemsQueued: [],
    itemsFinished: [],
    failedItems: [],
  },
  errors: {},
  progresses: {},
  timing: {
    startedAt: undefined,
    estimatedEndAt: undefined,
  },
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
    restrictToGlobalSelection: false,
  },
};

const { actions, reducer } = createSlice({
  name: 'upload',
  initialState,
  reducers: {
    clearUploadHistoryForCurrentJobType(state) {
      const jobType = state.dialog.selectedJob.type;
      if (jobType) {
        clearUploadHistoryForJobTypeHelper(state, jobType);
      }
    },

    clearUploadHistoryForJobType(state, action: PayloadAction<string>) {
      const { payload: jobType } = action;
      if (jobType) {
        clearUploadHistoryForJobTypeHelper(state, jobType);
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
        targets: Identifier[];
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

      clearQueues(state, { showLastUploadResult: false });

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
      const jobType = state.currentJob.type;

      // Dispatched by the saga; should not be dispatched manually

      // Store the data in history
      if (jobType) {
        const historyItem = createHistoryItem(
          cancelled ? 'cancelled' : success ? 'success' : 'error',
          state.queues,
          state.errors
        );

        if (!state.history[jobType]) {
          state.history[jobType] = [];
        }
        state.history[jobType].push(historyItem);
        state.history[jobType] = compactHistory(state.history[jobType]);
      }

      // Clear queues and show the last upload result in the dialog.
      // Everything related to the job is persisted in the history.
      clearQueues(state, { showLastUploadResult: true });

      // Reset the current job to an idle state
      state.currentJob.running = false;
    },

    _notifyUploadStartedAt(state, action: PayloadAction<number>) {
      // Start the upload
      state.currentJob.running = true;

      // Hide the result of the last upload task in the dialog box
      state.dialog.showLastUploadResult = false;

      // Record the time when the upload started
      state.timing.startedAt = action.payload;
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
        action: PayloadAction<{ uavId: Identifier; message: string }>
      ) {
        const { uavId, message } = action.payload;
        if (message) {
          state.errors[uavId] = message;
        } else {
          delete state.errors[uavId];
        }
      },

      prepare: (uavId: Identifier, message: string | Error) => ({
        payload: { uavId, message: String(message) },
      }),
    },

    _setEstimatedCompletionTime(
      state,
      action: PayloadAction<number | undefined>
    ) {
      state.timing.estimatedEndAt = Number.isFinite(action.payload)
        ? action.payload
        : undefined;
    },

    _setProgressInfoForUAV: {
      reducer(
        state,
        action: PayloadAction<{ uavId: Identifier; progress: number }>
      ) {
        const { uavId, progress } = action.payload;
        if (progress >= 0 && progress <= 1) {
          state.progresses[uavId] = progress;
        } else {
          delete state.progresses[uavId];
        }
      },

      prepare: (uavId: Identifier, progress: number) => ({
        payload: { uavId, progress },
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
        job?: JobData;
        options?: { backAction?: Action; restrictToGlobalSelection?: boolean };
      }>
    ) {
      const { payload } = action;
      const { job, options } = payload ?? {};
      const { type: newJobType, payload: newJobPayload } = job ?? {};
      const { backAction, restrictToGlobalSelection } = options ?? {};

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
        clearQueues(state, { showLastUploadResult: false });
      }

      state.dialog.backAction = backAction;
      state.dialog.selectedJob = {
        type: newJobType,
        payload: newJobPayload,
      };
      state.dialog.showLastUploadResult = false;
      state.dialog.open = true;
      if (restrictToGlobalSelection !== undefined) {
        state.settings.restrictToGlobalSelection = restrictToGlobalSelection;
      }
    },

    setRestrictToGlobalSelection(state, action: PayloadAction<boolean>) {
      state.settings.restrictToGlobalSelection = action.payload;
    },

    toggleRestrictToGlobalSelection(state) {
      state.settings.restrictToGlobalSelection =
        !state.settings.restrictToGlobalSelection;
    },

    // Trigger actions for the upload saga

    startUpload: noPayload<UploadSliceState>(() => {
      // Nothing else to do, this action triggers a saga as a side effect and
      // the saga will do the hard work.
    }),

    cancelUpload: noPayload<UploadSliceState>(() => {
      // The action will stop the upload saga; nothing to do here.
      // State will be updated in _notifyUploadFinished()
      console.log('cancelUpload() called');
    }),
  },

  extraReducers(builder) {
    builder.addCase(_clearLoadedShow, (state) => {
      clearUploadHistoryForJobTypeHelper(state, SHOW_UPLOAD_JOB.type);
    });
  },
});

export const {
  cancelUpload,
  clearUploadHistoryForCurrentJobType,
  clearUploadHistoryForJobType,
  clearUploadQueue,
  closeUploadDialog,
  dismissLastUploadResult,
  _enqueueFailedUploads,
  _enqueueSuccessfulUploads,
  _notifyUploadFinished,
  _notifyUploadStartedAt,
  _notifyUploadOnUavCancelled,
  _notifyUploadOnUavFailed,
  _notifyUploadOnUavQueued,
  _notifyUploadOnUavStarted,
  _notifyUploadOnUavSucceeded,
  _setEstimatedCompletionTime,
  _setErrorMessageForUAV,
  _setProgressInfoForUAV,
  openUploadDialogForJob,
  openUploadDialogKeepingCurrentJob,
  setupNextUploadJob,
  putUavsInWaitingQueue,
  removeUavsFromWaitingQueue,
  setUploadAutoRetry,
  setFlashFailed,
  setRestrictToGlobalSelection,
  startUpload,
  toggleRestrictToGlobalSelection,
} = actions;

export default reducer;
