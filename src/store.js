/**
 * @file The master store for the application state.
 */

import { createStore, applyMiddleware } from 'redux'
import createDebounce from 'redux-debounce'
import { actionTypes as reduxFormActionTypes } from 'redux-form'
import createSagaMiddleware from 'redux-saga'
import * as storage from 'redux-storage'
import thunk from 'redux-thunk'
import debounce from 'redux-storage-decorator-debounce'
import filter from 'redux-storage-decorator-filter'
import createEngine from 'redux-storage-engine-localstorage'

import * as actions from './actions/types'
import reducer from './reducers'
import rootSaga from './sagas'

/**
 * Storage engine for storing the application state. In the browser, we store
 * the state in the browser's local storage. In the Electron version, we store
 * the state in a separate JSON file.
 */
const engine = debounce(
  filter(
    window.bridge
      ? window.bridge.createStateStore()
      : createEngine('flockwave-client'),
    [
      'whitelisted-key',
      ['dialogs', 'appSettings'],
      ['dialogs', 'featureEditor'],
      ['dialogs', 'layerSettings'],
      ['dialogs', 'messages'],
      ['dialogs', 'savedLocationEditor'],
      ['dialogs', 'serverSettings'],
      ['features'],
      ['map'],
      ['meta'],
      ['savedLocations'],
      ['settings'],
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
 * Redux middleware that manages long-running background processes.
 */
const sagaMiddleware = createSagaMiddleware()

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
  applyMiddleware(debouncer, thunk, sagaMiddleware, storageMiddleware)(createStore)

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

/**
 * Function that clears the contents of the store completely. It is strongly
 * advised to reload the app after this function was executed.
 */
export function clearStore () {
  engine.save({})
}

// Spin up the root saga
sagaMiddleware.run(rootSaga)

export default store
