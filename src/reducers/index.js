import { combineReducers } from 'redux'
import { reducer as formReducer } from 'redux-form'

import serverSettingsReducer from './server-settings'
import snackbarReducer from './snackbar'

const reducer = combineReducers({
  serverSettings: serverSettingsReducer,
  snackbar: snackbarReducer,
  form: formReducer
})

export default reducer
