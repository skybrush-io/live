/**
 * @file Action factories related to the discovery of the executable
 * corresponding to the Flockwave server on the local machine.
 */

import { createAction } from 'redux-actions'

import {
  LOCAL_SERVER_EXECUTABLE_SEARCH_RESULT,
  START_LOCAL_SERVER_EXECUTABLE_SEARCH
} from './types'

/**
 * Action factory that creates an action that notifies the store that the
 * search for the executable of the server process has started.
 */
export const notifyLocalServerExecutableSearchStarted = createAction(
  LOCAL_SERVER_EXECUTABLE_SEARCH_RESULT,
  () => ({ scanning: true })
)

/**
 * Action factory that creates an action that notifies the store that the
 * search for the executable of the server process completed successfully.
 */
export const notifyLocalServerExecutableSearchFinished = createAction(
  LOCAL_SERVER_EXECUTABLE_SEARCH_RESULT,
  result => ({ result })
)

/**
 * Action factory that creates an action that notifies the store that the
 * search for the executable of the server process failed.
 */
export const notifyLocalServerExecutableSearchFailed = createAction(
  LOCAL_SERVER_EXECUTABLE_SEARCH_RESULT,
  error => ({ error })
)

/**
 * Action factory that creates an action that clears the stored executable
 * information from the store, which will in turn force the corresponding
 * saga to search for the executable again.
 */
export const startLocalServerExecutableSearch = createAction(
  START_LOCAL_SERVER_EXECUTABLE_SEARCH
)
