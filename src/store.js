/**
 * @file The master store for the application state.
 */

import { createStore, applyMiddleware } from 'redux'
import * as storage from 'redux-storage'
import filter from 'redux-storage-decorator-filter'
import createEngine from 'redux-storage-engine-localstorage'

import reducer from './reducers'

/**
 * Storage engine for storing the application state in the browser's
 * local storage.
 */
const engine = filter(
  createEngine('flockwave-client'), [
    'whitelisted-key',
    ['serverSettings']
  ]
)

/**
 * Redux middleware that saves the state of the application into the
 * browser's local storage after every action.
 */
const storageMiddleware = storage.createMiddleware(engine)

/**
 * Function to create a new Redux store with the required middlewares.
 */
const createStoreWithMiddleware = applyMiddleware(storageMiddleware)(createStore)

/**
 * The store for the application state.
 */
const store = createStoreWithMiddleware(
    reducer, undefined,
    window.devToolsExtension ? window.devToolsExtension() : undefined
)

// Restore any previous state of the store
storage.createLoader(engine)(store)

export default store
