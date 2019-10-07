/**
 * @file Reducer function for handling the part of the state object that
 * stores the state of the various dialogs.
 */

import { combineReducers } from 'redux'

import appSettingsReducer from './app-settings'
import authenticationReducer from './authentication'
import errorHandlingReducer from './error-handling'
import featureEditorReducer from './feature-editor'
import messagesReducer from './messages'
import promptReducer from './prompt'
import layerSettingsReducer from './layer-settings'
import savedLocationEditorReducer from './saved-location-editor'
import serverSettingsReducer from './server-settings'

/**
 * The reducer function that is responsible for handling all dialog-related
 * parts in the global state object.
 */
const reducer = combineReducers({
  appSettings: appSettingsReducer,
  authentication: authenticationReducer,
  error: errorHandlingReducer,
  featureEditor: featureEditorReducer,
  layerSettings: layerSettingsReducer,
  messages: messagesReducer,
  prompt: promptReducer,
  savedLocationEditor: savedLocationEditorReducer,
  serverSettings: serverSettingsReducer
})

export default reducer
