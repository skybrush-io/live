import { combineReducers } from 'redux';

import connectionsReducer from './connections';
import dialogsReducer from './dialogs';
import featuresReducer from './features';
import mapReducer from './map';
import messagesReducer from './messages';
import settingsReducer from './settings';

import clocksReducer from '~/features/clocks/slice';
import datasetsReducer from '~/features/datasets/slice';
import docksReducer from '~/features/docks/slice';
import localServerReducer from '~/features/local-server/slice';
import logReducer from '~/features/log/slice';
import savedLocationsReducer from '~/features/saved-locations/slice';
import serversReducer from '~/features/servers/slice';
import sidebarReducer from '~/features/sidebar/slice';
import snackbarReducer from '~/features/snackbar/slice';
import uavReducer from '~/features/uavs/slice';
import workbenchReducer from '~/features/workbench/slice';

/**
 * The global reducer of the application.
 */
const reducer = combineReducers({
  clocks: clocksReducer,
  connections: connectionsReducer,
  datasets: datasetsReducer,
  dialogs: dialogsReducer,
  docks: docksReducer,
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
  uavs: uavReducer,
  workbench: workbenchReducer
});

export default reducer;
