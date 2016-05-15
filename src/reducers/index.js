import { combineReducers } from 'redux'
import { reducer as formReducer } from 'redux-form'
import * as storage from 'redux-storage'
import defaultMerger from 'redux-storage-merger-simple'

import config from '../config'
import connectionsReducer from './connections'
import serverSettingsReducer from './server-settings'
import snackbarReducer from './snackbar'

/**
 * State merger that takes the default state of the Redux store and the
 * state that was loaded back from the local storage of the browser, and
 * returns the actual state to use.
 *
 * This function falls back to the default merger of <code>redux-stoage</code>
 * first to merge the initial state with the locally stored state, and then
 * adds the default hostname and port from the configuration object if no
 * hostname is specified for the server. This has to be done late in the
 * process to avoid connecting to the default server for a split second
 * before the locally stored state is restored.
 *
 * @param {Object} oldState  the default state from Redux
 * @param {Object} newState  the state restored by <code>redux-storage</code>
 * @return {Object} the merged state
 */
const merger = (oldState, newState) => {
  const merged = defaultMerger(oldState, newState)

  if (merged.serverSettings.hostName === null) {
    Object.assign(merged.serverSettings, config.server)
  }

  return merged
}

/**
 * The global reducer of the application, wrapped in a wrapper provided by
 * <code>redux-storage</code> to facilitate saving its state in the local
 * storage of the browser.
 */
const reducer = storage.reducer(
  combineReducers({
    connections: connectionsReducer,
    serverSettings: serverSettingsReducer,
    snackbar: snackbarReducer,
    form: formReducer
  }),
  merger
)

export default reducer
