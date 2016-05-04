import { combineReducers } from 'redux'
import { reducer as formReducer } from 'redux-form'
import serverSettings from './server-settings'

const masterReducer = combineReducers({
  serverSettings,
  form: formReducer
})

export default masterReducer
