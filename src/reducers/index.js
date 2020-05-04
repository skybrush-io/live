import { combineReducers } from 'redux';

import dialogsReducer from './dialogs';
import featuresReducer from './features';
import mapReducer from './map';
import messagesReducer from './messages';

import clocksReducer from '~/features/clocks/slice';
import connectionsReducer from '~/features/connections/slice';
import datasetsReducer from '~/features/datasets/slice';
import docksReducer from '~/features/docks/slice';
import lcdClockReducer from '~/features/lcd-clock/slice';
import localServerReducer from '~/features/local-server/slice';
import logReducer from '~/features/log/slice';
import missionReducer from '~/features/mission/slice';
import preflightReducer from '~/features/preflight/slice';
import savedLocationsReducer from '~/features/saved-locations/slice';
import serversReducer from '~/features/servers/slice';
import sessionReducer from '~/features/session/slice';
import settingsReducer from '~/features/settings/slice';
import sidebarReducer from '~/features/sidebar/slice';
import showReducer from '~/features/show/slice';
import snackbarReducer from '~/features/snackbar/slice';
import threeDReducer from '~/features/three-d/slice';
import tourReducer from '~/features/tour/slice';
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
  lcdClock: lcdClockReducer,
  localServer: localServerReducer,
  log: logReducer,
  map: mapReducer,
  messages: messagesReducer,
  mission: missionReducer,
  preflight: preflightReducer,
  savedLocations: savedLocationsReducer,
  servers: serversReducer,
  session: sessionReducer,
  settings: settingsReducer,
  show: showReducer,
  sidebar: sidebarReducer,
  snackbar: snackbarReducer,
  threeD: threeDReducer,
  tour: tourReducer,
  uavs: uavReducer,
  workbench: workbenchReducer,
});

export default reducer;
