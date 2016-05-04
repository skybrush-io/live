/**
 * @file Reducer function for handling the part of the state object that
 * stores the server to connect to.
 */

import { handleActions } from 'redux-actions'

/**
 * The default settings for the server to connect to, and whether the
 * server settings dialog is visible or not.
 */
const defaultState = {
  'server': 'localhost',
  'port': 5000,
  'dialogVisible': false
}

/**
 * The reducer function that handles actions related to the server
 * settings.
 */
const serverSettings = handleActions({
  SHOW_SERVER_SETTINGS_DIALOG: (state, action) => (
    Object.assign({}, state, { 'dialogVisible': true })
  )
}, defaultState)

export default serverSettings
