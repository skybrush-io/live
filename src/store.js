/**
 * @file The master store for the application state.
 */

import { createStore, applyMiddleware } from 'redux'
import * as storage from 'redux-storage'
import filter from 'redux-storage-decorator-filter'
import createEngine from 'redux-storage-engine-localstorage'

import * as actions from './actions/types'
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
const storageMiddleware = storage.createMiddleware(
  engine,
  /* blacklisted actions */
  [
    actions.CLEAR_CLOCK_LIST,
    actions.CLEAR_CONNECTION_LIST,
    actions.CLOSE_ERROR_DIALOG,
    actions.SET_CLOCK_STATE,
    actions.SET_CLOCK_STATE_MULTIPLE,
    actions.SET_CONNECTION_STATE,
    actions.SET_CONNECTION_STATE_MULTIPLE,
    actions.SHOW_ERROR_MESSAGE,
    actions.SHOW_SNACKBAR_MESSAGE,
    'redux-form/BLUR',
    'redux-form/CHANGE',
    'redux-form/FOCUS',
    'redux-form/INITIALIZE',
    'redux-form/DESTROY'
  ]
)

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
