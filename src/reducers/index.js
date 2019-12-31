import { combineReducers } from 'redux';

import clocksReducer from './clocks';
import connectionsReducer from './connections';
import datasetsReducer from './datasets';
import dialogsReducer from './dialogs';
import featuresReducer from './features';
import localServerReducer from './local-server';
import mapReducer from './map';
import messagesReducer from './messages';
import savedLocationsReducer from './saved-locations';
import serversReducer from './servers';
import settingsReducer from './settings';
import sidebarReducer from './sidebar';
import workbenchReducer from './workbench';

import logReducer from '~/features/log/slice';
import snackbarReducer from '~/features/snackbar/slice';

/**
 * The global reducer of the application.
 */
const reducer = combineReducers({
  clocks: clocksReducer,
  connections: connectionsReducer,
  datasets: datasetsReducer,
  dialogs: dialogsReducer,
  features: featuresReducer,
  localServer: localServerReducer,
  log: logReducer,
  map: mapReducer,
  messages: messagesReducer,
  savedLocations: savedLocationsReducer,
  servers: serversReducer,
  settings: settingsReducer,
  sidebar: sidebarReducer,
  snackbar: snackbarReducer,
  workbench: workbenchReducer
});

export default reducer;
