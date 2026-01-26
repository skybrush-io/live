import {
  combineReducers,
  type Action,
  type ThunkAction,
  type ThunkDispatch,
} from '@reduxjs/toolkit';
import undoable, { includeAction } from 'redux-undo';

/**
 * Reducer functions for handling the part of the state object that stores the
 * state of the various dialogs.
 */
import collectiveRTHReducer from '~/features/collective-rth/slice';
import dockDetailsDialogReducer from '~/features/docks/details';
import errorHandlingReducer from '~/features/error-handling/slice';
import featureEditorReducer from '~/features/map-features/editor';
import layerSettingsReducer from '~/features/map/layer-settings-dialog';
import promptReducer from '~/features/prompt/slice';
import savedLocationEditorReducer from '~/features/saved-locations/editor';
import authenticationReducer from '~/features/servers/authentication-dialog';
import deauthenticationReducer from '~/features/servers/deauthentication-dialog';
import serverSettingsReducer from '~/features/servers/server-settings-dialog';
import appSettingsReducer from '~/features/settings/dialog';
import showConfiguratorReducer, {
  historyInit,
  historyJump,
  historyRedo,
  historySnap,
  historyUndo,
  type ShowConfiguratorState,
  type ShowData,
} from '~/features/show-configurator/slice';
import uavDetailsDialogReducer from '~/features/uavs/details';

/**
 * Reducer functions for handling the top-level keys of the state object.
 */
import alertReducer from '~/features/alert/slice';
import beaconsReducer from '~/features/beacons/slice';
import clocksReducer from '~/features/clocks/slice';
import connectionsReducer from '~/features/connections/slice';
import datasetsReducer from '~/features/datasets/slice';
import detachablePanelsReducer from '~/features/detachable-panels/slice';
import docksReducer from '~/features/docks/slice';
import fieldNotesReducer from '~/features/field-notes/slice';
import firmwareUpdateReducer from '~/features/firmware-update/slice';
import hotkeysReducer from '~/features/hotkeys/slice';
import lcdClockReducer from '~/features/lcd-clock/slice';
import licenseInfoReducer from '~/features/license-info/slice';
import lightControlReducer from '~/features/light-control/slice';
import localServerReducer from '~/features/local-server/slice';
import logReducer from '~/features/log/slice';
import mapCachingReducer from '~/features/map-caching/slice';
import featuresReducer from '~/features/map-features/slice';
import mapReducer from '~/features/map/slice';
import measurementReducer from '~/features/measurement/slice';
import messagesReducer from '~/features/messages/slice';
import missionReducer from '~/features/mission/slice';
import parametersReducer from '~/features/parameters/slice';
import preflightReducer from '~/features/preflight/slice';
import rtkReducer from '~/features/rtk/slice';
import safetyReducer from '~/features/safety/slice';
import savedLocationsReducer from '~/features/saved-locations/slice';
import serversReducer from '~/features/servers/slice';
import sessionReducer from '~/features/session/slice';
import settingsReducer from '~/features/settings/slice';
import showReducer from '~/features/show/slice';
import sidebarReducer from '~/features/sidebar/slice';
import threeDReducer from '~/features/three-d/slice';
import uavControlReducer from '~/features/uav-control/slice';
import logDownloadReducer from '~/features/uavs/log-download';
import uavReducer from '~/features/uavs/slice';
import uploadReducer from '~/features/upload/slice';
import versionCheckReducer from '~/features/version-check/slice';
import weatherReducer from '~/features/weather/slice';
import workbenchReducer from '~/features/workbench/slice';

/**
 * The reducer function that is responsible for handling all dialog-related
 * parts in the global state object.
 */
const dialogsReducer = combineReducers({
  appSettings: appSettingsReducer,
  authentication: authenticationReducer,
  deauthentication: deauthenticationReducer,
  dockDetails: dockDetailsDialogReducer,
  collectiveRTH: collectiveRTHReducer,
  error: errorHandlingReducer,
  featureEditor: featureEditorReducer,
  layerSettings: layerSettingsReducer,
  prompt: promptReducer,
  savedLocationEditor: savedLocationEditorReducer,
  serverSettings: serverSettingsReducer,
  showConfigurator: undoable<ShowConfiguratorState, { showData?: ShowData }>(
    showConfiguratorReducer,
    {
      clearHistoryType: historyInit.type,
      filter: includeAction([historySnap.type]),
      capture: ({ showData }) => ({ showData }),
      restore: ({ showData }, current) => ({ ...current, showData }),
      jumpType: historyJump.type,
      redoType: historyRedo.type,
      undoType: historyUndo.type,
    }
  ),
  uavDetails: uavDetailsDialogReducer,
});

/**
 * The global reducer of the application.
 */
const reducer = combineReducers({
  alert: alertReducer,
  beacons: beaconsReducer,
  clocks: clocksReducer,
  connections: connectionsReducer,
  datasets: datasetsReducer,
  detachablePanels: detachablePanelsReducer,
  dialogs: dialogsReducer,
  docks: docksReducer,
  features: featuresReducer,
  fieldNotes: fieldNotesReducer,
  firmwareUpdate: firmwareUpdateReducer,
  hotkeys: hotkeysReducer,
  lcdClock: lcdClockReducer,
  licenseInfo: licenseInfoReducer,
  lightControl: lightControlReducer,
  localServer: localServerReducer,
  log: logReducer,
  logDownload: logDownloadReducer,
  map: mapReducer,
  mapCaching: mapCachingReducer,
  measurement: measurementReducer,
  messages: messagesReducer,
  mission: missionReducer,
  parameters: parametersReducer,
  preflight: preflightReducer,
  rtk: rtkReducer,
  safety: safetyReducer,
  savedLocations: savedLocationsReducer,
  servers: serversReducer,
  session: sessionReducer,
  settings: settingsReducer,
  show: showReducer,
  sidebar: sidebarReducer,
  threeD: threeDReducer,
  uavs: uavReducer,
  uavControl: uavControlReducer,
  upload: uploadReducer,
  versionCheck: versionCheckReducer,
  weather: weatherReducer,
  workbench: workbenchReducer,
});

export default reducer;

// TODO: Move to `ReturnType<typeof store.getState>` and `typeof store.dispatch`
// respectively, when `~/store/index` gets annotated, according to:
// https://redux.js.org/usage/usage-with-typescript#define-root-state-and-dispatch-types
export type RootState = ReturnType<typeof reducer>;
export type AppDispatch = ThunkDispatch<RootState, unknown, Action<string>>;
export type AppSelector<T, ExtraArgs extends unknown[] = []> = (
  state: RootState,
  ...args: ExtraArgs
) => T;
export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action<string>
>;
