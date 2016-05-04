import { combineReducers } from 'redux'
import serverSettings from './server-settings'

const masterReducer = combineReducers({
  serverSettings
})

export default masterReducer
