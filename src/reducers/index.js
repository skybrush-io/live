import { combineReducers } from 'redux'
import { reducer as formReducer } from 'redux-form'
import * as storage from 'redux-storage'
import defaultMerger from 'redux-storage-merger-simple'

import config from '../config'
import clocksReducer from './clocks'
import connectionsReducer from './connections'
import dialogsReducer from './dialogs'
import featuresReducer from './features'
import logReducer from './log'
import mapReducer from './map'
import messagesReducer from './messages'
import metaReducer from './meta'
import savedLocationsReducer from './saved-locations'
import sidebarReducer from './sidebar'
import snackbarReducer from './snackbar'
import workbenchReducer from './workbench'

/**
 * Returns the schema version of the state object.
 *
 * @param  {Object} state  the entire state store
 * @return {number} the schema version of the state object
 */
const getSchemaVersion = state => (
  (state && state.meta ? state.meta.schemaVersion : 0) || 0
)

/**
 * State merger that takes the default state of the Redux store and the
 * state that was loaded back from the local storage of the browser, and
 * returns the actual state to use.
 *
 * This function falls back to the default merger of <code>redux-storage</code>
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
  const newSchemaVersion = getSchemaVersion(newState)
  const oldSchemaVersion = getSchemaVersion(oldState)
  const willUpgrade = newSchemaVersion < oldSchemaVersion

  if (!willUpgrade) {
    // If we are not upgrading the schema, make sure that we don't restore
    // any ordered collections from the old state (otherwise this would cause
    // removed locations to re-appear in the store if we have stored some
    // locations in the default state)
    for (const key in newState) {
      // TODO: create a dedicated function for merging two ordered collections,
      // and then use that
      if (oldState.hasOwnProperty(key) && oldState[key] && oldState[key].byId) {
        delete oldState[key].byId
        delete oldState[key].order
      }
    }
  }

  const merged = defaultMerger(oldState, newState)

  if (willUpgrade) {
    merged.meta.schemaVersion = oldSchemaVersion
  }

  if (merged.dialogs.serverSettings.hostName === null) {
    Object.assign(merged.dialogs.serverSettings, config.server)
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
    clocks: clocksReducer,
    connections: connectionsReducer,
    dialogs: dialogsReducer,
    features: featuresReducer,
    form: formReducer,
    log: logReducer,
    map: mapReducer,
    meta: metaReducer,
    messages: messagesReducer,
    savedLocations: savedLocationsReducer,
    sidebar: sidebarReducer,
    snackbar: snackbarReducer,
    workbench: workbenchReducer
  }),
  merger
)

export default reducer
