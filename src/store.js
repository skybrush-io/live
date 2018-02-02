/**
 * @file The master store for the application state.
 */

import isElectron from 'is-electron'
import { createStore, applyMiddleware } from 'redux'
import createDebounce from 'redux-debounce'
import { actionTypes as reduxFormActionTypes } from 'redux-form'
import * as storage from 'redux-storage'
import debounce from 'redux-storage-decorator-debounce'
import filter from 'redux-storage-decorator-filter'
import createEngine from '@redux-storage-engine'

import * as actions from './actions/types'
import reducer from './reducers'

/**
 * Storage engine for storing the application state in the browser's
 * local storage.
 */
const engine = debounce(
  filter(
    isElectron ? createEngine() : createEngine('flockwave-client'),
    [
      'whitelisted-key',
      ['dialogs', 'layerSettings'],
      ['dialogs', 'messages'],
      ['dialogs', 'serverSettings'],
      ['features'],
      ['map'],
      ['meta'],
      ['savedLocations'],
      ['sidebar'],
      ['workbench']
    ]
  ),
  1000 /* msec */
)

/**
 * Blacklisted actions that should not trigger a state save.
 */
const actionBlacklist = [
  actions.CLEAR_CLOCK_LIST,
  actions.CLEAR_CONNECTION_LIST,
  actions.CLOSE_ERROR_DIALOG,
  actions.DISMISS_SNACKBAR,
  actions.SET_CLOCK_STATE,
  actions.SET_CLOCK_STATE_MULTIPLE,
  actions.SET_CONNECTION_STATE,
  actions.SET_CONNECTION_STATE_MULTIPLE,
  actions.SHOW_ERROR_MESSAGE,
  actions.SHOW_SNACKBAR_MESSAGE,
  ...Object.values(reduxFormActionTypes)
]

/**
 * Redux middleware that debounces actions with the right metadata.
 */
const debouncer = createDebounce({
  simple: 300 /* msec */
})

/**
 * Redux middleware that saves the state of the application into the
 * browser's local storage after every action.
 */
const storageMiddleware = storage.createMiddleware(
  engine, actionBlacklist
)

/**
 * Function to create a new Redux store with the required middlewares.
 */
const createStoreWithMiddleware =
  applyMiddleware(debouncer, storageMiddleware)(createStore)

/**
 * The store for the application state.
 */
const store = createStoreWithMiddleware(
  reducer, undefined,
  window.devToolsExtension ? window.devToolsExtension() : undefined
)

/**
 * Function that will load the contents of the store from the storage
 * backend. This must be called manually during application startup
 * when it is safe to do so.
 *
 * @return  {Promise}  a promise that resolves when the state of the
 *          store is restored
 */
export const loadStoreFromStorageBackend =
  () => storage.createLoader(engine)(store)

export default store
