import { combineReducers } from 'redux'
import { reducer as formReducer } from 'redux-form'
import * as storage from 'redux-storage'

import connectionsReducer from './connections'
import serverSettingsReducer from './server-settings'
import snackbarReducer from './snackbar'

/**
 * The global reducer of the application, wrapped in a wrapper provided by
 * <code>redux-storage</code> to facilitate saving its state in the local
 * storage of the browser.
 */
const reducer = storage.reducer(combineReducers({
  connections: connectionsReducer,
  serverSettings: serverSettingsReducer,
  snackbar: snackbarReducer,
  form: formReducer
}))

export default reducer
