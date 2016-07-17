/**
 * @file Reducer function for handling the part of the state object that
 * stores the state of the various dialogs.
 */

import { combineReducers } from 'redux'

import errorHandlingReducer from './error-handling'
import layerSettingsReducer from './layer-settings'
import serverSettingsReducer from './server-settings'

/**
 * The reducer function that is responsible for handling all dialog-related
 * parts in the global state object.
 */
const reducer = combineReducers({
  error: errorHandlingReducer,
  layerSettings: layerSettingsReducer,
  serverSettings: serverSettingsReducer
})

export default reducer
