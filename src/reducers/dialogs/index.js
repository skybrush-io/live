/**
 * @file Reducer function for handling the part of the state object that
 * stores the state of the various dialogs.
 */

import { combineReducers } from 'redux';

import appSettingsReducer from '~/features/settings/dialog';
import authenticationReducer from '~/features/servers/authentication-dialog';
import deauthenticationReducer from '~/features/servers/deauthentication-dialog';
import dockDetailsDialogReducer from '~/features/docks/details';
import errorHandlingReducer from '~/features/error-handling/slice';
import featureEditorReducer from '~/features/map-features/editor';
import geofenceSettingsReducer from '~/features/geofence/slice';
import layerSettingsReducer from '~/features/map/layer-settings-dialog';
import promptReducer from '~/features/prompt/slice';
import savedLocationEditorReducer from '~/features/saved-locations/editor';
import serverSettingsReducer from '~/features/servers/server-settings-dialog';
import uavDetailsDialogReducer from '~/features/uavs/details';

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
  savedLocationEditor: savedLocationEditorReducer,
  serverSettings: serverSettingsReducer,
  uavDetails: uavDetailsDialogReducer,
});

export default reducer;
