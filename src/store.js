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
import has from 'lodash-es/has';
import isError from 'lodash-es/isError';
import isFunction from 'lodash-es/isFunction';
import pickBy from 'lodash-es/pickBy';
import createDeferred from 'p-defer';
import createDebounce from 'redux-debounce';
import { createPromise } from 'redux-promise-middleware';
import createSagaMiddleware from 'redux-saga';
import { persistStore, persistReducer } from 'redux-persist';
import autoMergeLevel2 from 'redux-persist/lib/stateReconciler/autoMergeLevel2';
import {
  createBlacklistFilter,
  createFilter
} from 'redux-persist-transform-filter';

import { updateUAVs } from './features/uavs/slice';
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
  stateReconciler: (inboundState, originalState, reducedState, ...rest) => {
    // Iterate over the top-level collections in the inboundState. If the
    // collections are defined, don't merge them with the collections in the
    // originalState as we don't want the example objects that we load into
    // the store by default to "come back" every time the state is rehydrated
    // at application startup.

    const isCollection = stateSlice => stateSlice && has(stateSlice, 'byId');
    const isSubslice = stateSlice =>
      stateSlice !== null &&
      typeof stateSlice === 'object' &&
      !Array.isArray(stateSlice);

    const cleanCollections = (inbound, original) => {
      const cleaned = pickBy(original, (_, key) => !isCollection(inbound[key]));

      for (const key of Object.keys(cleaned)) {
        if (isSubslice(cleaned[key]) && has(inbound, key)) {
          cleaned[key] = cleanCollections(inbound[key], cleaned[key]);
        }
      }

      return cleaned;
    };

    if (inboundState && typeof inboundState === 'object') {
      // Maybe we have a hack here: originalState is outright ignored and
      // we pass cleanedState both as original and as "reduced" state to
      // autoMergeLevel2(). It is unclear to me what the difference is between
      // the two states, and it does not work if I pass originalState instead
      // of cleanedState in the second argument.
      const cleanedState = cleanCollections(inboundState, reducedState);
      return autoMergeLevel2(inboundState, cleanedState, cleanedState, ...rest);
    }

    return autoMergeLevel2(inboundState, originalState, reducedState, ...rest);
  },

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

    createBlacklistFilter('show', ['data', 'upload'])
  ]
};

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
        ignore: ['show.data']
      },

      serializableCheck: {
        /* redux-persist uses functions in actions and redux-promise-middleware
         * uses errors. This setting  silences a warning about them */
        isSerializable: value =>
          isPlain(value) ||
          isFunction(value) ||
          isPromise(value) ||
          isError(value),

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
    actionsBlacklist: [updateUAVs.type]
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
