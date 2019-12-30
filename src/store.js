/**
 * @file The master store for the application state.
 */

import {
  configureStore,
  getDefaultMiddleware,
  isPlain
} from '@reduxjs/toolkit';

import localForage from 'localforage';
import isFunction from 'lodash-es/isFunction';
import createDeferred from 'p-defer';
import createDebounce from 'redux-debounce';
import promise from 'redux-promise-middleware';
import createSagaMiddleware from 'redux-saga';
import { persistStore, persistReducer } from 'redux-persist';
import autoMergeLevel2 from 'redux-persist/lib/stateReconciler/autoMergeLevel2';
import { createFilter } from 'redux-persist-transform-filter';

import reducer from './reducers';

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

  // reconcile two levels of the incoming state object with the defaults
  stateReconciler: autoMergeLevel2,

  // do not store the following slices of the state in the storage
  blacklist: [
    'clocks',
    'connections',
    'datasets',
    'localServer',
    'log',
    'messages',
    'servers',
    'snackbar'
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
    ])
  ]
};

/**
 * Redux middleware that debounces actions with the right metadata.
 */
const debouncer = createDebounce({
  simple: 300 /* Msec */
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
      serializableCheck: {
        /* redux-persist uses functions in actions; this silences a warning about them */
        isSerializable: value => isPlain(value) || isFunction(value)
      }
    }),
    debouncer,
    promise,
    sagaMiddleware
  ]
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
