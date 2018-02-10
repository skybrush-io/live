/**
 * @file Reducer function for handling the part of the state object that
 * stores the state of the dialog that allows the user to edit the
 * app settings.
 */

import { handleActions } from 'redux-actions'
import u from 'updeep'

/**
 * The default state for the app settings dialog.
 */
const defaultState = {
  open: false,
  selectedTab: 'display'
}

/**
 * The reducer function that handles actions related to the app
 * settings dialog.
 */
const reducer = handleActions({
  SHOW_APP_SETTINGS_DIALOG: (state, action) => (
    u({ open: true }, state)
  ),

  TOGGLE_APP_SETTINGS_DIALOG: (state, action) => (
    u({ open: !state.open }, state)
  ),

  CLOSE_APP_SETTINGS_DIALOG: (state, action) => (
    u({ open: false }, state)
  ),

  SET_APP_SETTINGS_DIALOG_TAB: (state, action) => (
    u({ selectedTab: action.payload }, state)
  )
}, defaultState)

export default reducer
