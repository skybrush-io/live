/**
 * @file Reducer function for handling the part of the state object that
 * stores the state of the various dialogs.
 */

import { combineReducers } from 'redux';

import dockDetailsDialogReducer from '~/features/docks/details';
import geofenceSettingsReducer from '~/features/geofence/slice';
import uavDetailsDialogReducer from '~/features/uavs/details';

import appSettingsReducer from './app-settings';
import authenticationReducer from './authentication';
import deauthenticationReducer from './deauthentication';
import errorHandlingReducer from './error-handling';
import featureEditorReducer from './feature-editor';
import layerSettingsReducer from './layer-settings';
import promptReducer from './prompt';
import serverSettingsReducer from './server-settings';

/**
 * The reducer function that is responsible for handling all dialog-related
 * parts in the global state object.
 */
const reducer = combineReducers({
  appSettings: appSettingsReducer,
  authentication: authenticationReducer,
  deauthentication: deauthenticationReducer,
  dockDetails: dockDetailsDialogReducer,
  error: errorHandlingReducer,
  featureEditor: featureEditorReducer,
  geofenceSettings: geofenceSettingsReducer,
  layerSettings: layerSettingsReducer,
  prompt: promptReducer,
  serverSettings: serverSettingsReducer,
  uavDetails: uavDetailsDialogReducer,
});

export default reducer;
