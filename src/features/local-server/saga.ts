/**
 * Sagas related to the discovery and management of the local server instance
 * that is started by the client on-demand if it is configured to do so.
 */

import type { PayloadAction } from '@reduxjs/toolkit';
import { all, call, delay, put, select, take } from 'redux-saga/effects';

import {
  replaceAppSettings,
  updateAppSettings,
} from '~/features/settings/slice';

import {
  getLocalServerExecutable,
  getLocalServerSearchPath,
} from './selectors';
import {
  notifyLocalServerExecutableSearchFailed,
  notifyLocalServerExecutableSearchFinished,
  notifyLocalServerExecutableSearchStarted,
  startLocalServerExecutableSearch,
} from './slice';

type LocalServerSearchFunction = (
  searchPath: string[]
) => Promise<string | undefined>;

type SearchResult = [string | undefined, string | undefined];

/**
 * Saga that attempts to find where the local server is installed on the
 * current machine, based on the local server settings.
 *
 * @param search a function that can be invoked with a list of search paths
 *        and that will return a promise that will eventually resolve to the
 *        local server executable on the system
 */
function* localServerExecutableDiscoverySaga(
  search: LocalServerSearchFunction
): Generator {
  let oldSearchPath: string[] | undefined;
  let minDuration = 0;

  while (true) {
    const searchPath: string[] = yield select(getLocalServerSearchPath);
    const executable: string | undefined = yield select(
      getLocalServerExecutable
    );

    if (executable === undefined || searchPath !== oldSearchPath) {
      // Path changed or a re-scan was forced
      // Start searching for the executable of the local server
      yield put(notifyLocalServerExecutableSearchStarted());

      const [searchResult]: [SearchResult, unknown] = yield all([
        call(async (): Promise<SearchResult> => {
          try {
            return [(await search(searchPath)) || '', undefined];
          } catch (error) {
            return [undefined, String(error)];
          }
        }),
        delay(minDuration),
      ]);

      const [serverPath, error] = searchResult;

      if (error) {
        yield put(notifyLocalServerExecutableSearchFailed(error));
      } else {
        // `serverPath` is non-null when `error` is undefined
        yield put(notifyLocalServerExecutableSearchFinished(serverPath!));
      }

      oldSearchPath = searchPath;
    }

    // Wait for the next signal to start a search
    const action: PayloadAction<unknown> = yield take([
      replaceAppSettings.type,
      updateAppSettings.type,
      startLocalServerExecutableSearch.type,
    ]);

    if (
      action.type === replaceAppSettings.type ||
      action.type === updateAppSettings.type
    ) {
      // Wait a bit more, effectively throttling multiple signals into one
      // action
      yield delay(1000);
    }

    // We simulate a minimum duration of 1 second for the search if the
    // user explicitly requested a re-scan; this is to ensure that the user
    // sees some feedback on the UI that the search is in progress
    minDuration =
      action.type === startLocalServerExecutableSearch.type ? 1000 : 0;
  }
}

/**
 * Compound saga related to the discovery and management of the local server
 * instance that is started by the client on-demand if it is configured to do
 * so.
 *
 * @param search a function that can be invoked with a list of search paths
 *        and that will return a promise that will eventually resolve to the
 *        local server executable on the system
 */
export default function* localServerSaga(
  search?: LocalServerSearchFunction
): Generator {
  const sagas = [];

  if (search) {
    sagas.push(localServerExecutableDiscoverySaga(search));
  }

  yield all(sagas);
}
