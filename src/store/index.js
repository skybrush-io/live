/**
 * @file The master store for the application state.
 */

import { bindActionCreators, configureStore, isPlain } from '@reduxjs/toolkit';

import config from 'config';
import isPromise from 'is-promise';
import localForage from 'localforage';
import isError from 'lodash-es/isError';
import isFunction from 'lodash-es/isFunction';
import createDeferred from 'p-defer';
import createDebounce from 'redux-debounce';
import { createPromise } from 'redux-promise-middleware';
import createSagaMiddleware from 'redux-saga';
import { persistStore, persistReducer } from 'redux-persist';
import {
  createBlacklistFilter,
  createFilter,
} from 'redux-persist-transform-filter';

import { updateAveragingByIds } from '~/features/measurement/slice';
import { shouldPreventSleepMode } from '~/features/power-saving/selectors';
import { updateRTKStatistics } from '~/features/rtk/slice';
import { showAppSettingsDialog } from '~/features/settings/actions';
import { loadingPromiseFulfilled } from '~/features/show/slice';
import { updateAgesOfUAVs, updateUAVs } from '~/features/uavs/slice';
import { saveWorkbenchState } from '~/features/workbench/slice';
import reducer from './reducers';

import migrations from './migrations';
import { defaultStateReconciler, pristineReconciler } from './reconciler';
import { bindSelectors } from './subscriptions';

/**
 * Configuration of `redux-persist` to store the application state.
 *
 * In the browser, we store the state in the browser's local storage using
 * `localForage`.
 *
 * In the Electron version, we store the state in a separate JSON file using
 * `electron-store`.
 */
const persistConfig = {
  key: 'flockwave-client',
  storage: window.bridge ? window.bridge.createStateStore() : localForage,
  version: 2,
  migrate: migrations,
  stateReconciler: defaultStateReconciler,

  // do not store the following slices of the state in the storage
  blacklist: [
    'alert',
    'beacons',
    'clocks',
    'connections',
    'datasets',
    'detachablePanels',
    'docks',
    'localServer',
    'log',
    'messages',
    'rtk',
    'servers',
    'session',
    'snackbar',
    'uavs',
    'weather',
  ],

  // do not save more frequently than once every second
  throttle: 1000 /* msec */,

  transforms: [
    // store the state of only the given dialogs
    createFilter('dialogs', [
      'appSettings',
      'featureEditor',
      'layerSettings',
      'messages',
      'savedLocationEditor',
      'serverSettings',
    ]),

    // The pending UAV Id overlay should be temporary and reset on reload
    createBlacklistFilter('hotkeys', ['pendingUAVId']),

    // We do not wish to store the state of the license check, only whether the
    // license info dialog is open
    createFilter('licenseInfo', ['dialog']),

    // We do not wish to store home/landing positions and takeoff heading in
    // the mission because they depend on the loaded show anyway
    createBlacklistFilter('mission', [
      'homePositions',
      'landingPositions',
      'takeoffHeadings',
    ]),

    // We do not wish to save which preflight checks the user has ticked off
    createBlacklistFilter('preflight', ['checked']),

    // Most of the stuff in the 'show' slice is temporary as we unload the
    // show when refreshing the page
    createFilter('show', ['environment']),

    // Store only the persistent settings of the upload procedure
    createFilter('upload', ['settings']),

    // We do not wish to save 3D view tooltips, camera pose or the scene ID
    createBlacklistFilter('threeD', ['camera', 'tooltip', 'sceneId']),
  ],
};

/* Examine the query string and prevent restoring the persisted state if the
 * 'pristine' query argument is specified. This can be used either as an
 * escape hatch when the persisted state is corrupted, or in setups where it
 * is important that the user starts from a clean configuration.
 */
const url = new URL(window.location.href);
const shouldStartWithPristineState =
  config.ephemeral || (url.searchParams && url.searchParams.get('pristine'));

if (shouldStartWithPristineState) {
  persistConfig.stateReconciler = pristineReconciler;
}

/**
 * Redux middleware that debounces actions with the right metadata.
 */
const debouncer = createDebounce({
  simple: 300 /* Msec */,
});

/**
 * Redux middleware that handles promises dispatched to the store.
 */
const promiseMiddleware = createPromise({
  promiseTypeDelimiter: 'Promise',
  promiseTypeSuffixes: ['Pending', 'Fulfilled', 'Rejected'],
});

/**
 * Redux middleware that manages long-running background processes.
 */
export const sagaMiddleware = createSagaMiddleware();

/**
 * The store for the application state.
 */
const store = configureStore({
  reducer: persistReducer(persistConfig, reducer),
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      // Immutability checks slow things down too much
      immutableCheck: false,

      serializableCheck: {
        /* redux-persist uses functions in actions and redux-promise-middleware
         * uses errors. This setting silences a warning about them */
        isSerializable: (value) =>
          isPlain(value) ||
          isFunction(value) ||
          isPromise(value) ||
          isError(value),

        // Checking the action dispatched when a show was loaded successfully
        // takes a long time and it should not be necessary anyway
        ignoredActions: [
          String(loadingPromiseFulfilled),
          String(saveWorkbenchState),
        ],

        // Checking the show specification takes a long time and it should not
        // be necessary anyway; same for the workbench state
        ignoredPaths: ['show.data', 'workbench'],
      },
    }).concat(debouncer, promiseMiddleware, sagaMiddleware),
  devTools:
    // eslint-disable-next-line node/prefer-global/process
    process.env.NODE_ENV === 'production'
      ? false
      : {
          actionsDenylist: [
            updateAgesOfUAVs.type,
            updateAveragingByIds.type,
            updateRTKStatistics.type,
            updateUAVs.type,
          ],

          // make sure that the show object that we load is not cached / tracked by
          // the Redux devtools
          actionSanitizer: (action) =>
            action.type === loadingPromiseFulfilled.type && action.payload
              ? { ...action, payload: '<<JSON_DATA>>' }
              : action,
          stateSanitizer: (state) =>
            state.show && state.show.data
              ? {
                  ...state,
                  show: { ...state.show, data: '<<JSON_DATA>>' },
                }
              : state,
        },
});

/**
 * Deferred that is resolved when the state has been restored.
 */
const stateLoaded = createDeferred();

/**
 * Redux-persist persistor object that can be used to programmatically load
 * or save the state of the store.
 */
export const persistor = persistStore(store, null, stateLoaded.resolve);

/**
 * Function that clears the contents of the store completely. It is strongly
 * advised to reload the app after this function was executed.
 */
export async function clearStore() {
  return persistor.purge();
}

/**
 * Function that asks the user to confirm whether he wants to clear all stored
 * settings and state information, then reloads the page.
 */
export async function clearStoreAfterConfirmation() {
  // eslint-disable-next-line no-alert
  if (window.confirm('Are you sure? All settings will be lost.')) {
    await clearStore();
    window.location.reload();
  }
}

/**
 * Async function that blocks execution until the state of the application has
 * been restored from local storage.
 */
export const waitUntilStateRestored = () => stateLoaded.promise;

// Send some of the allowed actions back to the preloader, bound to the
// store instance. The preloader may then call these actions but cannot dispatch
// arbitrary actions to the store.
if (window.bridge) {
  window.bridge.provideActions(
    bindActionCreators(
      {
        showAppSettingsDialog,
      },
      store.dispatch
    )
  );

  // Also provide a method for the preloader to subscribe to the changes of
  // certain selectors
  window.bridge.provideSubscriptions(
    bindSelectors(
      {
        shouldPreventSleepMode,
      },
      store
    )
  );
}

export default store;
