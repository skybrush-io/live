/**
 * @file State slice for keeping track of downloaded logs.
 */

import {
  createSelector,
  createSlice,
  type PayloadAction,
} from '@reduxjs/toolkit';

import type { ProgressInfo } from '~/flockwave/messages';
import type { Identifier } from '~/utils/collections';
import { type AppDispatch, type AppSelector } from '~/store/reducers';

// Poor man's content-addressable store for keeping the downloaded logs
// NOTE: This is a very one-off solution, no effort has been made to generalize
//       it. If we need a reusable version it should be cleaned up and moved to
//       `~/utils`. (Or, rather, a proper CAS package should be included.)
const logContents = new (class {
  #data: Record<string, string> = {};
  #encoder = new TextEncoder();
  write = async (item: string) => {
    // prettier-ignore
    const hash = (
      Array.from(new Uint8Array(
        await window.crypto.subtle.digest('SHA-1', this.#encoder.encode(item))
      ), (byte) => byte.toString(16).padStart(2, '0')).join('')
    );
    this.#data[hash] = item;
    return hash;
  };
  read = (hash: string) => this.#data[hash];
})();

export enum LogDownloadStatus {
  LOADING = 'loading',
  ERROR = 'error',
  SUCCESS = 'success',
}

type LogDownloadState =
  | {
      status: LogDownloadStatus.LOADING;
      progress?: ProgressInfo;
    }
  | {
      status: LogDownloadStatus.ERROR;
      error: string;
    }
  | {
      status: LogDownloadStatus.SUCCESS;
      value: string;
    };

type LogId = string;
type LogDownloadSliceState = Record<
  Identifier,
  Record<LogId, LogDownloadState | undefined> | undefined
>;

const initialState: LogDownloadSliceState = {};

const { actions, reducer } = createSlice({
  name: 'log-download',
  initialState,

  // TODO: Reduce the repetitiveness of these!
  reducers: {
    setLogDownloadProgress: {
      prepare: (uavId: Identifier, logId: LogId, progress?: ProgressInfo) => ({
        payload: { uavId, logId, progress },
      }),
      reducer(
        state,
        {
          payload: { uavId, logId, progress },
        }: PayloadAction<{
          uavId: Identifier;
          logId: LogId;
          progress?: ProgressInfo;
        }>
      ) {
        (state[uavId] ??= {})[logId] = {
          status: LogDownloadStatus.LOADING,
          progress,
        };
      },
    },

    setLogDownloadError: {
      prepare: (uavId: Identifier, logId: LogId, error: string) => ({
        payload: { uavId, logId, error },
      }),
      reducer(
        state,
        {
          payload: { uavId, logId, error },
        }: PayloadAction<{ uavId: Identifier; logId: LogId; error: string }>
      ) {
        (state[uavId] ??= {})[logId] = {
          status: LogDownloadStatus.ERROR,
          error,
        };
      },
    },

    setLogDownloadValue: {
      prepare: (uavId: Identifier, logId: LogId, value: string) => ({
        payload: { uavId, logId, value },
      }),
      reducer(
        state,
        {
          payload: { uavId, logId, value },
        }: PayloadAction<{ uavId: Identifier; logId: LogId; value: string }>
      ) {
        (state[uavId] ??= {})[logId] = {
          status: LogDownloadStatus.SUCCESS,
          value,
        };
      },
    },
  },
});

/* Actions */

export const {
  setLogDownloadError,
  setLogDownloadProgress,
  setLogDownloadValue,
} = actions;

export const initiateLogDownload =
  (uavId: Identifier, logId: LogId) => (dispatch: AppDispatch) => {
    dispatch(setLogDownloadProgress(uavId, logId));
  };

export const storeDownloadedLog =
  (uavId: Identifier, logId: LogId, log: string) =>
  async (dispatch: AppDispatch) => {
    const value = await logContents.write(log);
    dispatch(setLogDownloadValue(uavId, logId, value));
  };

/* Selectors */

export const getLogDownloadState =
  (
    uavId: Identifier,
    logId: LogId
  ): AppSelector<LogDownloadState | undefined> =>
  (state) =>
    state.logDownload[uavId]?.[logId];

export const retrieveDownloadedLog = (
  uavId: Identifier,
  logId: LogId
): AppSelector<string | undefined> =>
  createSelector(getLogDownloadState(uavId, logId), (state) => {
    if (state?.status === LogDownloadStatus.SUCCESS) {
      return logContents.read(state.value);
    }
  });

/* Reducer */

export default reducer;
