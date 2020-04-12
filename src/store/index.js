/**
 * @file The master store for the application state.
 */

import {
  configureStore,
  getDefaultMiddleware,
  isPlain
} from '@reduxjs/toolkit';

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
  createFilter
} from 'redux-persist-transform-filter';

import { loadingPromiseFulfilled } from '../features/show/slice';
import { updateAgesOfUAVs, updateUAVs } from '../features/uavs/slice';
import reducer from '../reducers';

import { defaultStateReconciler, pristineReconciler } from './reconciler';

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
  version: 1,
  stateReconciler: defaultStateReconciler,

  // do not store the following slices of the state in the storage
  blacklist: [
    'clocks',
    'connections',
    'datasets',
    'docks',
    'localServer',
    'log',
    'messages',
    'servers',
    'snackbar',
    'uavs'
  ],

  // do not save more frequently than once every second
  throttle: 1000 /* msec */,

  // store the state of only the given dialogs
  transforms: [
    createFilter('dialogs', [
      'appSettings',
      'featureEditor',
      'layerSettings',
      'messages',
      'savedLocationEditor',
      'serverSettings'
    ]),

    // We do not wish to save which preflight checks the user has ticked off
    createBlacklistFilter('preflight', ['checked']),

    // it would be better to use a blacklist filter here that simply excludes
    // 'data' and 'upload', but it makes a deep copy, which is very expensive
    // if we have a show loaded in 'data'
    createFilter('show', [
      'environment',
      'takeoffAreaSetupDialog',
      'startTimeDialog',
      'uploadDialog'
    ]),

    // We do not wish to save 3D view tooltips or camera pose
    createBlacklistFilter('threeD', ['camera', 'tooltip'])
  ]
};

/* Examine the query string and prevent restoring the persisted state if the
 * 'pristine' query argument is specified. This can be used either as an
 * escape hatch when the persisted state is corrupted, or in setups where it
 * is important that the user starts from a clean configuration.
 */
const url = new URL(window.location.href);
if (url.searchParams && url.searchParams.get('pristine')) {
  persistConfig.stateReconciler = pristineReconciler;
}

/**
 * Redux middleware that debounces actions with the right metadata.
 */
const debouncer = createDebounce({
  simple: 300 /* Msec */
});

/**
 * Redux middleware that handles promises dispatched to the store.
 */
const promiseMiddleware = createPromise({
  promiseTypeDelimiter: 'Promise',
  promiseTypeSuffixes: ['Pending', 'Fulfilled', 'Rejected']
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
  middleware: [
    ...getDefaultMiddleware({
      immutableCheck: {
        // Checking the show specification takes a long time and it should not
        // be necessary anyway
        ignore: ['show.data'],
        // ignore was renamed to ignoredPaths in newer versions of the middleware.
        // Let's specify both to be on the safe side.
        ignoredPaths: ['show.data']
      },

      serializableCheck: {
        /* redux-persist uses functions in actions and redux-promise-middleware
         * uses errors. This setting  silences a warning about them */
        isSerializable: (value) =>
          isPlain(value) ||
          isFunction(value) ||
          isPromise(value) ||
          isError(value),

        // Checking the action dispatched when a show was loaded successfully
        // takes a long time and it should not be necessary anyway
        ignoredActions: [loadingPromiseFulfilled],

        // Checking the show specification takes a long time and it should not
        // be necessary anyway
        ignoredPaths: ['show.data']
      }
    }),
    debouncer,
    promiseMiddleware,
    sagaMiddleware
  ],
  devTools: {
    actionsBlacklist: [updateUAVs.type, updateAgesOfUAVs.type],

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
            show: { ...state.show, data: '<<JSON_DATA>>' }
          }
        : state
  }
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
export const clearStore = persistor.purge;

/**
 * Async function that blocks execution until the state of the application has
 * been restored from local storage.
 */
export const waitUntilStateRestored = () => stateLoaded.promise;

// Send the store dispatcher function back to the preloader
if (window.bridge) {
  window.bridge.dispatch = store.dispatch;
}

export default store;
