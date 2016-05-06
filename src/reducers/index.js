import { combineReducers } from 'redux'
import { reducer as formReducer } from 'redux-form'

import connectionsReducer from './connections'
import serverSettingsReducer from './server-settings'
import snackbarReducer from './snackbar'

const reducer = combineReducers({
  connections: connectionsReducer,
  serverSettings: serverSettingsReducer,
  snackbar: snackbarReducer,
  form: formReducer
})

export default reducer
